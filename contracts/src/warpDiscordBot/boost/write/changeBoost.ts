import { ContractAction, ContractState, ContractResult } from '../../types/types';

declare const ContractError;
declare const SmartWeave;

export const changeBoost = async (
  state: ContractState,
  { input: { name, boostValue } }: ContractAction
): Promise<ContractResult> => {
  if (!name) {
    throw new ContractError(`Boost name should be provided.`);
  }

  if (typeof name != 'string') {
    throw new ContractError(`Boost name should be of type 'string'.`);
  }

  if (!boostValue) {
    throw new ContractError(`Boost value should be provided.`);
  }

  if (typeof boostValue != 'number') {
    throw new ContractError(`Boost value should be of type 'number'.`);
  }

  const boosts = state.boosts;

  if (!boosts[name]) {
    throw new ContractError(`Boost with given name does not exist.`);
  }

  boosts[name] = boostValue;
  return { state };
};
