import { checkArgumentSet, validateString } from '../../../utils';
import { ContractAction, ContractState, ContractResult } from '../../types/types';

export const getAddress = async (state: ContractState, { input }: ContractAction): Promise<ContractResult> => {
  checkArgumentSet(input, 'id');
  validateString(input, 'id');

  const { id } = input;
  const address = state.users[id];

  if (!address) {
    throw new ContractError('Id has no address assigned.');
  }

  return { result: { address } };
};
