import { checkArgumentSet, validateString } from '../../../utils';
import { countBoostsPoints } from '../../messagesContent/write/addMessage';
import {
  ContractAction,
  ContractState,
  ContractResult,
  onChainTransactionsPrefix,
  ContractInput,
} from '../../types/types';

export const addPointsWithCap = async (state: ContractState, { input }: ContractAction): Promise<ContractResult> => {
  checkArgumentSet(input, 'adminId');
  validateString(input, 'adminId');
  checkArgumentSet(input, 'members');

  const { adminId, members, noBoost, cap } = input;
  if (!state.admins.includes(adminId)) {
    throw new ContractError(`Only admin can award points.`);
  }

  if (!state.temporaryTotalSum || input.initialCapInteraction) state.temporaryTotalSum = 0;
  if (!state.temporaryBalances || input.initialCapInteraction) state.temporaryBalances = {};

  for (let i = 0; i < members.length; i++) {
    const txId = members[i].txId;
    const address = members[i].id;
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

    const userId = getUser(address, state);
    const points = members[i].points || input.points;
    if (!Number.isInteger(points)) {
      throw new ContractError(`Invalid points for member ${userId}`);
    }
    logger.info(`Transaction: ${txId} for wallet address: ${address}: user_id: ${userId}.`);

    if (userId) {
      const roles = members[i].roles;
      let boostsPoints = points;
      if (!noBoost) {
        boostsPoints *= countBoostsPoints(state, [], roles);
      }

      state.temporaryBalances[members[i].id] = { balance: boostsPoints, userId, roles };
      state.temporaryTotalSum += boostsPoints;
      logger.info(`Transaction: ${txId} for wallet address: ${members[i].id}: points: ${boostsPoints}.`);
    } else {
      logger.warn(`Transaction: ${txId} for wallet address: ${members[i].id}: user not registered in Warpy`);
      state.temporaryBalances[members[i].id] = { balance: points, userId: null, roles: [] };
      state.temporaryTotalSum += points;
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

  if (cap) {
    const addPointsEvent = addFinalPoints(state, input);
    return { state, event: { users: addPointsEvent } };
  } else {
    return { state };
  }
};

function addFinalPoints(state: ContractState, input: ContractInput) {
  const cap = input.cap;
  const totalSum = state.temporaryTotalSum;
  if (!totalSum) {
    throw new ContractError(`No total sum.`);
  }
  const addPointsEvent: { userId: string; points: number; roles: string[] }[] = [];

  for (const user in state.temporaryBalances) {
    const record = state.temporaryBalances[user];
    const sumCalculated = Math.round((record.balance / totalSum) * cap);
    const tokens = state.balances[user];
    const newTokensAmount = tokens ? tokens + sumCalculated : sumCalculated;
    state.balances[user] = newTokensAmount;
    if (record.userId) {
      addPointsEvent.push({ userId: record.userId, points: sumCalculated, roles: record.roles });
    }
  }

  state.temporaryBalances = {};
  state.temporaryTotalSum = 0;

  return addPointsEvent;
}

function getUser(address: string, state: ContractState) {
  for (const user in state.users) {
    if (state.users[user].toLowerCase() == address.toLowerCase()) {
      return user;
    }
  }
  return false;
}
