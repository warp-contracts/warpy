import { ContractAction, ContractState, ContractResult } from '../../types/types';

declare const ContractError;

export const evolve = async (
  state: ContractState,
  { caller, input: { value } }: ContractAction
): Promise<ContractResult> => {
  if (state.owner !== caller) {
    throw new ContractError('Only the owner can evolve a contract.');
  }

  state.evolve = value;

  return { state };
};
