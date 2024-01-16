import { checkArgumentSet, validateString } from '../../../utils';
import { ContractAction, ContractState, ContractResult } from '../../types/types';

export const getUserId = async (state: ContractState, { input }: ContractAction): Promise<ContractResult> => {
  checkArgumentSet(input, 'address');
  validateString(input, 'address');

  const { address } = input;
  const userId = Object.keys(state.users).find((u) => state.users[u].toLowerCase() == address.toLowerCase());

  if (!userId) {
    throw new ContractError('Addresss has no id assigned.');
  }

  return { result: { userId } };
};
