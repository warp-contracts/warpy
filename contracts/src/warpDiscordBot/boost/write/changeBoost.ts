import { checkArgumentSet, validateInteger, validateString } from '../../../utils';
import { ContractAction, ContractState, ContractResult } from '../../types/types';

export const changeBoost = async (state: ContractState, { input }: ContractAction): Promise<ContractResult> => {
  checkArgumentSet(input, 'name');
  validateString(input, 'name');
  checkArgumentSet(input, 'boostValue');
  validateInteger(input, 'boostValue');
  checkArgumentSet(input, 'adminId');
  validateString(input, 'adminId');

  const { name, boostValue, adminId } = input;
  const boosts = state.boosts;

  if (!state.admins.includes(adminId)) {
    throw new ContractError(`Only admin can change boost.`);
  }

  if (!boosts[name]) {
    throw new ContractError(`Boost with given name does not exist.`);
  }

  boosts[name] = boostValue;
  return { state };
};
