import { checkArgumentSet, validateString } from '../../../utils';
import { ContractAction, ContractState, ContractResult, counterPrefix } from '../../types/types';

export const getCounter = async (state: ContractState, { input }: ContractAction): Promise<ContractResult> => {
  checkArgumentSet(input, 'id');
  validateString(input, 'id');

  const { id } = input;
  const counter = state.counter[id];

  return { result: { counter } };
};
