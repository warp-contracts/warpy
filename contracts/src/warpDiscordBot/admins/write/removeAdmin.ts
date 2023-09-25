import { validateInputArgumentPresence, validateString } from '../../../utils';
import { ContractAction, ContractState, ContractResult } from '../../types/types';

declare const ContractError;

export const removeAdmin = async (state: ContractState, { input: { id } }: ContractAction): Promise<ContractResult> => {
  validateInputArgumentPresence(id, 'id');
  validateString(id, 'id');

  if (!state.admins.includes(id)) {
    throw new ContractError(`Admin's not on the list.`);
  }

  state.admins.splice(state.admins.indexOf(id), 1);
  return { state };
};
