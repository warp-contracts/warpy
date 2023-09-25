import { validateInputArgumentPresence, validateInteger, validateString } from '../../../utils';
import { ContractAction, ContractState, ContractResult } from '../../types/types';

declare const ContractError;
declare const SmartWeave;

export const addSeasonToRole = async (
  state: ContractState,
  { input: { name, from, to, boost, boostValue, role } }: ContractAction
): Promise<ContractResult> => {
  validateInputArgumentPresence(name, 'name');
  validateString(name, 'name');
  validateInputArgumentPresence(from, 'from');
  validateInteger(from, 'from');
  validateInputArgumentPresence(to, 'to');
  validateInteger(to, 'to');
  validateInputArgumentPresence(boost, 'boost');
  validateString(boost, 'boost');
  validateInputArgumentPresence(boostValue, 'boostValue');
  validateInteger(boostValue, 'boostValue');

  state.boosts[boost] = boostValue;
  state.seasons[name] = {
    from,
    to,
    boost,
    role,
  };
  return { state };
};
