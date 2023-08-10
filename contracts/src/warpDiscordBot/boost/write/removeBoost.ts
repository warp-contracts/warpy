import { ContractAction, ContractState, ContractResult } from '../../types/types';

declare const ContractError;
declare const SmartWeave;

export const removeBoost = async (
  state: ContractState,
  { input: { name } }: ContractAction
): Promise<ContractResult> => {
  if (!name) {
    throw new ContractError(`Boost name should be provided.`);
  }

  if (typeof name != 'string') {
    throw new ContractError(`Boost name should be of type 'string'.`);
  }

  const boost = state.boosts[name];

  if (!boost) {
    throw new ContractError(`Boost with given name does not exist.`);
  }

  delete state.boosts[name];

  return { state };
};
