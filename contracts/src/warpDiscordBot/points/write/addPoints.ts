import { countBoostsPoints } from '../../messagesContent/write/addMessage';
import {
  ContractAction,
  ContractState,
  ContractResult,
  messagesPrefix,
  counterPrefix,
  usersPrefix,
  balancesPrefix,
} from '../../types/types';

declare const ContractError;
declare const SmartWeave;

export const addPoints = async (
  state: ContractState,
  { input: { id, points, adminId } }: ContractAction
): Promise<ContractResult> => {
  if (!id) {
    throw new ContractError(`User's id should be provided.`);
  }

  if (!points) {
    throw new ContractError(`Points should be provided.`);
  }

  if (!adminId) {
    throw new ContractError(`Caller's id should be provided.`);
  }

  if (!state.admins.includes(adminId)) {
    throw new ContractError(`Only admin can award points.`);
  }

  const counter = await SmartWeave.kv.get(`${counterPrefix}${id}`);

  let boostsPoints = points;
  let counterObj: { messages: number; reactions: number; boosts: string[]; points: number } = {
    messages: 0,
    reactions: 0,
    boosts: [],
    points: 0,
  };
  if (counter) {
    boostsPoints *= countBoostsPoints(state, counter.boosts);
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

  return { state };
};
