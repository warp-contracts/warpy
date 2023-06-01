import { ContractAction, ContractState, ContractResult, balancesPrefix } from '../../types/types';

declare const ContractError;
declare const SmartWeave;

export const balance = async (state: ContractState, { input: { target } }: ContractAction): Promise<ContractResult> => {
  if (typeof target !== 'string') {
    throw new ContractError('Must specify target to get balance for');
  }

  const ticker = state.ticker;

  const result = await SmartWeave.kv.get(`${balancesPrefix}${target}`);

  return { result: { target, ticker, balance: result ? result : 0 } };
};
