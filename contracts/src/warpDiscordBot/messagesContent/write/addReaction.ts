import {
  ContractAction,
  ContractState,
  ContractResult,
  counterPrefix,
  usersPrefix,
  balancesPrefix,
} from '../../types/types';
import { countBoostsPoints } from './addMessage';

declare const ContractError;
declare const SmartWeave;

export const addReaction = async (state: ContractState, { input: { id } }: ContractAction): Promise<ContractResult> => {
  if (!id) {
    throw new ContractError(`Caller's id should be provided.`);
  }

  const counter = await SmartWeave.kv.get(`${counterPrefix}${id}`);

  let boostsPoints = state.reactionsTokenWeight;
  let counterObj: { messages: number; reactions: number; boosts: string[]; points: number } = {
    messages: 0,
    reactions: 0,
    points: 0,
    boosts: [],
  };
  if (counter) {
    boostsPoints *= countBoostsPoints(state, counter.boosts);
    counterObj = {
      messages: counter.messages,
      reactions: counter.reactions + 1,
      boosts: counter.boosts,
      points: counter.points + boostsPoints,
    };
  } else {
    counterObj = { messages: 0, reactions: 1, boosts: [], points: state.reactionsTokenWeight };
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
