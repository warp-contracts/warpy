import { checkArgumentSet, validateInteger, validateString } from '../../../utils';
import { addTokensBalance, countBoostsPoints } from '../../messagesContent/write/addMessage';
import { ContractAction, ContractState, ContractResult, onChainTransactionsPrefix } from '../../types/types';

export const addPointsForAddress = async (state: ContractState, { input }: ContractAction): Promise<ContractResult> => {
  checkArgumentSet(input, 'points');
  validateInteger(input, 'points');
  checkArgumentSet(input, 'adminId');
  validateString(input, 'adminId');
  checkArgumentSet(input, 'members');

  const { points, adminId, members, noBoost } = input;
  if (!state.admins.includes(adminId)) {
    throw new ContractError(`Only admin can award points.`);
  }

  const addPointsEvent: { userId: string; points: number; roles: string[] }[] = [];

  for (let i = 0; i < members.length; i++) {
    const txId = members[i].txId;
    if (txId) {
      const txPoints = await SmartWeave.kv.get(`${onChainTransactionsPrefix}${txId}_${members[i].id}`);
      if (txPoints) {
        logger.warn(`Transaction: ${txId} for wallet address: ${members[i].id} already rewarded.`);
        continue;
      }
    }
    const userId = Object.keys(state.users).find((u) => state.users[u] == members[i].id);

    if (userId) {
      const roles = members[i].roles;
      const counter = state.counter[userId];
      let boostsPoints = points;
      let counterObj: { messages: number; reactions: number; boosts: string[]; points: number };
      if (counter) {
        if (!noBoost) {
          boostsPoints *= countBoostsPoints(state, counter.boosts, roles);
        }
        counterObj = {
          messages: counter.messages,
          reactions: counter.reactions,
          boosts: counter.boosts,
          points: counter.points + boostsPoints,
        };
      } else {
        counterObj = { messages: 0, reactions: 0, boosts: [], points: boostsPoints };
      }

      state.counter[userId] = counterObj;

      addTokensBalance(state, userId, boostsPoints);
      addPointsEvent.push({ userId, points: boostsPoints, roles });
    } else {
      const tokens = state.balances[members[i].id];
      const newTokensAmount = tokens ? tokens + points : points;
      state.balances[members[i].id] = newTokensAmount;
    }

    if (txId) {
      await SmartWeave.kv.put(`${onChainTransactionsPrefix}${txId}_${members[i].id}`, points);
    }
  }

  return { state, event: { users: addPointsEvent } };
};