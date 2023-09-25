import { validateInputArgumentPresence, validateString } from '../../../utils';
import { ContractAction, ContractState, ContractResult, counterPrefix } from '../../types/types';

declare const ContractError;

export const getBoost = async (state: ContractState, { input: { name } }: ContractAction): Promise<ContractResult> => {
  validateInputArgumentPresence(name, 'name');
  validateString(name, 'name');

  const boost = state.boosts[name];

  return { result: boost ? { boost } : { boost: null } };
};
