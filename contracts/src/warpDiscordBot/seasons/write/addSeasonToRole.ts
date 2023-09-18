import { ContractAction, ContractState, ContractResult } from '../../types/types';

declare const ContractError;
declare const SmartWeave;

export const addSeasonToRole = async (
  state: ContractState,
  { input: { name, from, to, boost, boostValue, role } }: ContractAction
): Promise<ContractResult> => {
  if (!name) {
    throw new ContractError(`Season name should be provided.`);
  }

  if (!from) {
    throw new ContractError(`From timestamp should be provided.`);
  }

  if (!to) {
    throw new ContractError(`To timestamp should be provided.`);
  }

  if (!boost) {
    throw new ContractError(`Boost name should be provided.`);
  }

  if (!boostValue) {
    throw new ContractError(`Boost value should be provided.`);
  }

  state.boosts[boost] = boostValue;
  state.seasons[name] = {
    from,
    to,
    boost,
    role,
  };
  return { state };
};
