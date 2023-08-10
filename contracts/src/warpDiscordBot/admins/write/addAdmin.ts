import { ContractAction, ContractState, ContractResult } from '../../types/types';

declare const ContractError;
declare const SmartWeave;

export const addAdmin = async (state: ContractState, { input: { id } }: ContractAction): Promise<ContractResult> => {
  if (!id) {
    throw new ContractError(`Admin's id should be provided.`);
  }

  if (state.admins.includes(id)) {
    throw new ContractError(`Admin's id already on the list.`);
  }

  state.admins.push(id);

  return { state };
};
