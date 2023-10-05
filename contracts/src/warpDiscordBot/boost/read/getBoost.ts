import { checkArgumentSet, validateString } from '../../../utils';
import { ContractAction, ContractState, ContractResult, counterPrefix } from '../../types/types';

export const getBoost = async (state: ContractState, { input }: ContractAction): Promise<ContractResult> => {
  checkArgumentSet(input, 'name');
  validateString(input, 'name');

  const { name } = input;
  const boost = state.boosts[name];

  return { result: { boost } };
};
