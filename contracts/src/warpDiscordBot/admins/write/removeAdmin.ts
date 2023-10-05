import { checkArgumentSet, validateString } from '../../../utils';
import { ContractAction, ContractState, ContractResult } from '../../types/types';

export const removeAdmin = async (state: ContractState, { input }: ContractAction): Promise<ContractResult> => {
  checkArgumentSet(input, 'userId');
  validateString(input, 'userId');
  checkArgumentSet(input, 'adminId');
  validateString(input, 'adminId');

  const { userId, adminId } = input;
  if (!state.admins.includes(adminId)) {
    throw new ContractError(`Only admin can remove admins.`);
  }
  if (!state.admins.includes(userId)) {
    throw new ContractError(`Admin's not on the list.`);
  }

  state.admins.splice(state.admins.indexOf(userId), 1);
  return { state };
};
