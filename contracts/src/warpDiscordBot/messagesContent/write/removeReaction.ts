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

export const removeReaction = async (
  state: ContractState,
  { input: { id } }: ContractAction
): Promise<ContractResult> => {
  if (!id) {
    throw new ContractError(`Caller's id should be provided.`);
  }

  const counter = await SmartWeave.kv.get(`${counterPrefix}${id}`);
  const counterObj = {
    ...counter,
    reactions: counter.reactions - 1,
  };
  await SmartWeave.kv.put(`${counterPrefix}${id}`, counterObj);
  state.counter[id] = counterObj;

  const address = await SmartWeave.kv.get(`${usersPrefix}${id}`);
  if (address) {
    const tokens = await SmartWeave.kv.get(`${balancesPrefix}${address}`);
    await SmartWeave.kv.put(`${balancesPrefix}${address}`, tokens - state.reactionsTokenWeight);

    state.balances[address] = tokens - state.reactionsTokenWeight;
  }
  return { state };
};
