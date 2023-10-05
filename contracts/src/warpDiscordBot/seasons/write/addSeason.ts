import { checkArgumentSet, validateInteger, validateString } from '../../../utils';
import { ContractAction, ContractState, ContractResult } from '../../types/types';

export const addSeason = async (state: ContractState, { input }: ContractAction): Promise<ContractResult> => {
  checkArgumentSet(input, 'name');
  validateString(input, 'name');
  checkArgumentSet(input, 'from');
  validateInteger(input, 'from');
  checkArgumentSet(input, 'to');
  validateInteger(input, 'to');
  checkArgumentSet(input, 'boost');
  validateString(input, 'boost');
  checkArgumentSet(input, 'adminId');
  validateString(input, 'adminId');

  const { name, from, to, boost, adminId } = input;

  if (!state.admins.includes(adminId)) {
    throw new ContractError(`Only admin can add season.`);
  }

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
