import { validateInputArgumentPresence, validateString } from '../../../utils';
import { ContractAction, ContractState, ContractResult, usersPrefix } from '../../types/types';

declare const ContractError;

export const registerUser = async (
  state: ContractState,
  { input: { id, address } }: ContractAction
): Promise<ContractResult> => {
  validateInputArgumentPresence(id, 'id');
  validateString(id, 'id');
  validateInputArgumentPresence(address, 'address');
  validateString(address, 'address');

  const users = state.users;

  if (Object.keys(users).includes(id)) {
    throw new ContractError('Id already assigned.');
  }

  if ([...Object.values(users)].includes(address)) {
    throw new ContractError('Address already assigned.');
  }

  state.users[id] = address;

  return { state };
};
