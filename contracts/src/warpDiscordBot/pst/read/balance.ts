import { validateInputArgumentPresence, validateString } from '../../../utils';
import { ContractAction, ContractState, ContractResult, balancesPrefix } from '../../types/types';

export const balance = async (state: ContractState, { input: { target } }: ContractAction): Promise<ContractResult> => {
  validateInputArgumentPresence(target, 'target');
  validateString(target, 'target');

  const ticker = state.ticker;

  return { result: { target, ticker, balance: state.balances[target] } };
};
