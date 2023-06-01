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

export const addReaction = async (state: ContractState, { input: { id } }: ContractAction): Promise<ContractResult> => {
  if (!id) {
    throw new ContractError(`Caller's id should be provided.`);
  }

  const counter = await SmartWeave.kv.get(`${counterPrefix}${id}`);

  let counterObj: { messages: number; reactions: number } = { messages: 0, reactions: 0 };
  if (counter) {
    counterObj = { messages: counter.messages, reactions: counter.reactions + 1 };
  } else {
    counterObj = { messages: 0, reactions: 1 };
  }

  await SmartWeave.kv.put(`${counterPrefix}${id}`, counterObj);
  state.counter[id] = counterObj;

  const address = await SmartWeave.kv.get(`${usersPrefix}${id}`);
  if (address) {
    const tokens = await SmartWeave.kv.get(`${balancesPrefix}${address}`);
    const newTokensAmount = tokens ? tokens + state.reactionsTokenWeight : state.reactionsTokenWeight;
    await SmartWeave.kv.put(`${balancesPrefix}${address}`, newTokensAmount);
    state.balances[address] = newTokensAmount;
  }

  return { state };
};
