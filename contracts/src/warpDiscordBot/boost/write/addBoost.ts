import { ContractAction, ContractState, ContractResult } from '../../types/types';

declare const ContractError;
declare const SmartWeave;

export const addBoost = async (
  state: ContractState,
  { input: { name, value } }: ContractAction
): Promise<ContractResult> => {
  if (!name) {
    throw new ContractError(`Boost name should be provided.`);
  }

  if (typeof name != 'string') {
    throw new ContractError(`Boost name should be of type 'string'.`);
  }

  if (!value) {
    throw new ContractError(`Boost value should be provided.`);
  }

  if (typeof value != 'number') {
    throw new ContractError(`Boost value should be of type 'number'.`);
  }

  const boosts = state.boosts;

  if (boosts[name]) {
    throw new ContractError(`Boost with given name already exists.`);
  }

  boosts[name] = value;
  return { state };
};