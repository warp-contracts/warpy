import { validateInputArgumentPresence, validateString } from '../../../utils';
import { ContractAction, ContractState, ContractResult, usersPrefix } from '../../types/types';

declare const ContractError;
declare const SmartWeave;

export const getAddress = async (state: ContractState, { input: { id } }: ContractAction): Promise<ContractResult> => {
  validateInputArgumentPresence(id, 'id');
  validateString(id, 'id');

  const address = state.users[id];

  if (!address) {
    throw new ContractError('Id has no address assigned.');
  }

  return { result: { address } };
};
