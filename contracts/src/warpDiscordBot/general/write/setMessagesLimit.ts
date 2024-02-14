import { checkArgumentSet, validateString } from '../../../utils';
import { ContractAction, ContractState, ContractResult } from '../../types/types';

export const setMessagesLimit = async (
  state: ContractState,
  { caller, input }: ContractAction
): Promise<ContractResult> => {
  validateString(input, 'adminId');
  checkArgumentSet(input, 'adminId');
  checkArgumentSet(input, 'messagesLimit');

  const { messagesLimit } = input;

  if (!state.admins.includes(input.adminId)) {
    throw new ContractError('Only admin can set messages limit.');
  }

  state.messagesLimit = messagesLimit;

  return { state };
};
