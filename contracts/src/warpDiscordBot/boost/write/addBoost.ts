import { validateInputArgumentPresence, validateInteger, validateString } from '../../../utils';
import { ContractAction, ContractState, ContractResult } from '../../types/types';

declare const ContractError;

export const addBoost = async (
  state: ContractState,
  { input: { name, boostValue } }: ContractAction
): Promise<ContractResult> => {
  validateInputArgumentPresence(name, 'name');
  validateString(name, 'name');
  validateInputArgumentPresence(boostValue, 'boostValue');
  validateInteger(boostValue, 'boostValue');

  const boosts = state.boosts;

  if (boosts[name]) {
    throw new ContractError(`Boost with given name already exists.`);
  }

  boosts[name] = boostValue;
  return { state };
};
