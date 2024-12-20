import { checkArgumentSet, validateInteger, validateString } from '../../../utils';
import { addTokensBalance, countBoostsPoints } from '../../messagesContent/write/addMessage';
import { ContractAction, ContractState, ContractResult, onChainTransactionsPrefix } from '../../types/types';

export const addPointsForAddress = async (state: ContractState, { input }: ContractAction): Promise<ContractResult> => {
  checkArgumentSet(input, 'adminId');
  validateString(input, 'adminId');
  checkArgumentSet(input, 'members');

  const { adminId, members, noBoost } = input;
  if (!state.admins.includes(adminId)) {
    throw new ContractError(`Only admin can award points.`);
  }

  const addPointsEvent: { userId: string; address: string; points: number; roles: string[]; balance: number }[] = [];

  for (let i = 0; i < members.length; i++) {
    const txId = members[i].txId;
    if (txId) {
      const txPoints = await SmartWeave.kv.get(`${onChainTransactionsPrefix}${txId}_${members[i].id}`);
      if (txPoints) {
        logger.warn(`Transaction: ${txId} for wallet address: ${members[i].id} already rewarded.`, {
          txId: SmartWeave.transaction.id,
          kvKey: `${onChainTransactionsPrefix}${txId}_${members[i].id}`,
          sortKey: SmartWeave.transaction.sortKey,
          avaxTxId: txId,
          member: members[i].id,
          points: JSON.stringify(txPoints),
        });
        continue;
      }
    }

    const userId = getUser(members[i].id, state);
    const points = members[i].points || input.points;
    if (!Number.isInteger(points)) {
      throw new ContractError(`Invalid points for member ${userId}`);
    }
    logger.info(`Transaction: ${txId} for wallet address: ${members[i].id}: wallet_id: ${userId}.`);

    if (userId) {
      const roles = members[i].roles;
      let boostsPoints = points;
      if (!noBoost) {
        boostsPoints *= countBoostsPoints(state, [], roles);
      }

      addTokensBalance(state, userId, boostsPoints);
      addPointsEvent.push({
        userId,
        address: state.users[userId],
        points: boostsPoints,
        roles,
        balance: state.balances[state.users[userId]],
      });
      logger.info(`Transaction: ${txId} for wallet address: ${members[i].id}: event: ${addPointsEvent}.`);
    } else {
      logger.warn(`Transaction: ${txId} for wallet address: ${members[i].id}: user not registered in Warpy.`);
      const tokens = state.balances[members[i].id];
      const newTokensAmount = tokens ? tokens + points : points;
      state.balances[members[i].id] = newTokensAmount;
    }

    if (txId) {
      logger.warn(`Putting transaction: ${txId} for wallet address: ${members[i].id} in KV Storage.`, {
        txId: SmartWeave.transaction.id,
        kvKey: `${onChainTransactionsPrefix}${txId}_${members[i].id}`,
        sortKey: SmartWeave.transaction.sortKey,
        avaxTxId: txId,
        member: members[i].id,
        points: JSON.stringify(points),
      });
      await SmartWeave.kv.put(`${onChainTransactionsPrefix}${txId}_${members[i].id}`, points);
    }
  }

  return { state, event: { name: 'upsertBalance', users: addPointsEvent } };
};

function getUser(address: string, state: ContractState) {
  for (const user in state.users) {
    if (state.users[user].toLowerCase() == address.toLowerCase()) {
      return user;
    }
  }
  return false;
}
