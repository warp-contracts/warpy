import { ContractAction, ContractState, ContractResult, counterPrefix } from '../../types/types';

declare const ContractError;
declare const SmartWeave;

export const getBoost = async (state: ContractState, { input: { name } }: ContractAction): Promise<ContractResult> => {
  if (!name) {
    throw new ContractError('Boost name must be provided.');
  }

  const boost = state.boosts[name];

  return { result: boost ? { boost } : { boost: 0 } };
};
