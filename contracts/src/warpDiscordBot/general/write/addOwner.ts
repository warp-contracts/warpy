import { ContractAction, ContractState, ContractResult } from '../../types/types';

export const addOwner = async (
  state: ContractState,
  { caller, input: { value } }: ContractAction
): Promise<ContractResult> => {
  if (!state.owners.includes(caller)) {
    throw new ContractError('Only the owner can add another owner to the contract.');
  }

  state.owners.push(value);

  return { state };
};
