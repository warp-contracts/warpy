import {
  ContractAction,
  ContractState,
  ContractResult,
  usersPrefix,
  counterPrefix,
  balancesPrefix,
} from '../../types/types';

declare const ContractError;
declare const SmartWeave;

export const mint = async (state: ContractState, { input: { id } }: ContractAction): Promise<ContractResult> => {
  const address = await SmartWeave.kv.get(`${usersPrefix}${id}`);
  if (!address) {
    throw new ContractError(`User is not registered in the name service.`);
  }

  const counter = await SmartWeave.kv.get(`${counterPrefix}${id}`);
  if (counter) {
    const tokens = counter.messages * state.messagesTokenWeight + counter.reactions * state.reactionsTokenWeight;
    await SmartWeave.kv.put(`${balancesPrefix}${address}`, tokens);
    state.balances[address] = tokens;
  }

  return { state };
};
