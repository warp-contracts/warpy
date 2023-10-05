import { checkArgumentSet, validateString } from '../../../utils';
import { ContractAction, ContractState, ContractResult, balancesPrefix } from '../../types/types';

export const balance = async (state: ContractState, { input }: ContractAction): Promise<ContractResult> => {
  checkArgumentSet(input, 'target');
  validateString(input, 'target');

  const { target } = input;
  const ticker = state.ticker;

  return { result: { target, ticker, balance: state.balances[target] } };
};
