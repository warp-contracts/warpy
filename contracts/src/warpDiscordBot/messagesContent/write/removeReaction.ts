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

export const removeReaction = async (
  state: ContractState,
  { input: { id, roles } }: ContractAction
): Promise<ContractResult> => {
  if (!id) {
    throw new ContractError(`Caller's id should be provided.`);
  }

  const counter = await SmartWeave.kv.get(`${counterPrefix}${id}`);
  let boostsPoints = state.reactionsTokenWeight;
  boostsPoints *= countBoostsPoints(state, counter.boosts, roles);
  const counterObj = {
    ...counter,
    reactions: counter.reactions - 1,
    points: counter.points - boostsPoints,
  };
  await SmartWeave.kv.put(`${counterPrefix}${id}`, counterObj);
  state.counter[id] = counterObj;

  const address = await SmartWeave.kv.get(`${usersPrefix}${id}`);
  if (address) {
    const tokens = await SmartWeave.kv.get(`${balancesPrefix}${address}`);
    await SmartWeave.kv.put(`${balancesPrefix}${address}`, tokens - boostsPoints);

    state.balances[address] = tokens - boostsPoints;
  }
  return { state };
};
