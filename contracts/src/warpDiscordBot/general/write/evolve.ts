import { ContractAction, ContractState, ContractResult } from '../../types/types';

export const evolve = async (
  state: ContractState,
  { caller, input: { value } }: ContractAction
): Promise<ContractResult> => {
  if (!state.owners.includes(caller)) {
    throw new ContractError('Only the owner can evolve a contract.');
  }

  state.evolve = value;

  return { state };
};
