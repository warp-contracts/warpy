import { validateInputArgumentPresence, validateString } from '../../../utils';
import { ContractAction, ContractState, ContractResult, counterPrefix } from '../../types/types';

declare const ContractError;
declare const SmartWeave;

export const removeUserBoost = async (
  state: ContractState,
  { input: { id, name } }: ContractAction
): Promise<ContractResult> => {
  validateInputArgumentPresence(name, 'name');
  validateString(name, 'name');
  validateInputArgumentPresence(id, 'id');
  validateString(id, 'id');

  const counter = state.counter[id];

  if (!counter.boosts.includes(name)) {
    throw new ContractError('Boost not found.');
  }
  counter.boosts.splice(counter.boosts.indexOf(name), 1);

  const userBoosts = state.counter[id].boosts;

  userBoosts.splice(userBoosts.indexOf(name), 1);
  return { state };
};
