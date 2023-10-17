import { checkArgumentSet, validateInteger, validateString } from '../../../utils';
import { ContractAction, ContractState, ContractResult } from '../../types/types';

export const addSeasonToRole = async (state: ContractState, { input }: ContractAction): Promise<ContractResult> => {
  checkArgumentSet(input, 'name');
  validateString(input, 'name');
  checkArgumentSet(input, 'from');
  validateInteger(input, 'from');
  checkArgumentSet(input, 'to');
  validateInteger(input, 'to');
  checkArgumentSet(input, 'boost');
  validateString(input, 'boost');
  checkArgumentSet(input, 'boostValue');
  validateInteger(input, 'boostValue');
  checkArgumentSet(input, 'adminId');
  validateString(input, 'adminId');

  const { name, from, to, boost, boostValue, role, adminId } = input;

  if (!state.admins.includes(adminId)) {
    throw new ContractError(`Only admin can add season.`);
  }

  state.boosts[boost] = boostValue;
  state.seasons[name] = {
    from,
    to,
    boost,
    role,
  };
  return { state, event: { name, from, to, role } };
};
