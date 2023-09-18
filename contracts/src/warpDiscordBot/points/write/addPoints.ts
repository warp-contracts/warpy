import { countBoostsPoints } from '../../messagesContent/write/addMessage';
import {
  ContractAction,
  ContractState,
  ContractResult,
  counterPrefix,
  usersPrefix,
  balancesPrefix,
} from '../../types/types';

declare const ContractError;
declare const SmartWeave;

export const addPoints = async (
  state: ContractState,
  { input: { points, adminId, members, noBoost } }: ContractAction
): Promise<ContractResult> => {
  if (!points) {
    throw new ContractError(`Points should be provided.`);
  }

  if (!adminId) {
    throw new ContractError(`Admin's id should be provided.`);
  }

  if (!members) {
    throw new ContractError(`No members provided.`);
  }

  if (!state.admins.includes(adminId)) {
    throw new ContractError(`Only admin can award points.`);
  }

  for (let i = 0; i < members.length; i++) {
    const id = members[i].id;
    const roles = members[i].roles;
    const counter = await SmartWeave.kv.get(`${counterPrefix}${id}`);

    let boostsPoints = points;
    let counterObj: { messages: number; reactions: number; boosts: string[]; points: number } = {
      messages: 0,
      reactions: 0,
      boosts: [],
      points: 0,
    };
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

    await SmartWeave.kv.put(`${counterPrefix}${id}`, counterObj);
    state.counter[id] = counterObj;

    const address = await SmartWeave.kv.get(`${usersPrefix}${id}`);
    if (address) {
      const tokens = await SmartWeave.kv.get(`${balancesPrefix}${address}`);
      const newTokensAmount = tokens ? tokens + boostsPoints : boostsPoints;
      await SmartWeave.kv.put(`${balancesPrefix}${address}`, newTokensAmount);

      state.balances[address] = newTokensAmount;
    }
  }

  return { state };
};
