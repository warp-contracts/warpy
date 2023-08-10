import { ContractAction, ContractState, ContractResult } from '../../types/types';

declare const ContractError;
declare const SmartWeave;

export const removeAdmin = async (state: ContractState, { input: { id } }: ContractAction): Promise<ContractResult> => {
  if (!id) {
    throw new ContractError(`Admin's id should be provided.`);
  }

  if (!state.admins.includes(id)) {
    throw new ContractError(`Admin's not on the list.`);
  }

  state.admins.splice(state.admins.indexOf(id), 1);
  return { state };
};
