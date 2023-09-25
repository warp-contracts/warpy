import { validateInputArgumentPresence, validateString } from '../../../utils';
import { ContractAction, ContractState, ContractResult } from '../../types/types';

declare const ContractError;

export const addAdmin = async (state: ContractState, { input: { id } }: ContractAction): Promise<ContractResult> => {
  validateInputArgumentPresence(id, 'id');
  validateString(id, 'id');

  if (state.admins.includes(id)) {
    throw new ContractError(`Admin's id already on the list.`);
  }

  state.admins.push(id);

  return { state };
};
