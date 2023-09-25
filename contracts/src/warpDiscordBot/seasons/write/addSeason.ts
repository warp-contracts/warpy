import { validateInputArgumentPresence, validateInteger, validateString } from '../../../utils';
import { ContractAction, ContractState, ContractResult } from '../../types/types';

declare const ContractError;
declare const SmartWeave;

export const addSeason = async (
  state: ContractState,
  { input: { name, from, to, boost } }: ContractAction
): Promise<ContractResult> => {
  validateInputArgumentPresence(name, 'name');
  validateString(name, 'name');
  validateInputArgumentPresence(from, 'from');
  validateInteger(from, 'from');
  validateInputArgumentPresence(to, 'to');
  validateInteger(to, 'to');
  validateInputArgumentPresence(boost, 'boost');
  validateString(boost, 'boost');

  if (!Object.keys(state.boosts).includes(boost)) {
    throw new ContractError(`Boost with given name does not exist. Please add boost first.`);
  }

  state.seasons[name] = {
    from,
    to,
    boost,
  };
  return { state };
};
