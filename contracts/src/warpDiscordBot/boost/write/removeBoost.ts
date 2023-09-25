import { validateInputArgumentPresence, validateString } from '../../../utils';
import { ContractAction, ContractState, ContractResult } from '../../types/types';

declare const ContractError;

export const removeBoost = async (
  state: ContractState,
  { input: { name } }: ContractAction
): Promise<ContractResult> => {
  validateInputArgumentPresence(name, 'name');
  validateString(name, 'name');

  const boost = state.boosts[name];

  if (!boost) {
    throw new ContractError(`Boost with given name does not exist.`);
  }

  delete state.boosts[name];

  return { state };
};
