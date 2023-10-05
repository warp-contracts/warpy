import { checkArgumentSet, validateInteger, validateString } from '../../../utils';
import { ContractAction, ContractState, ContractResult } from '../../types/types';

export const addBoost = async (state: ContractState, { input }: ContractAction): Promise<ContractResult> => {
  checkArgumentSet(input, 'name');
  validateString(input, 'name');
  checkArgumentSet(input, 'boostValue');
  validateInteger(input, 'boostValue');
  checkArgumentSet(input, 'adminId');
  validateString(input, 'adminId');

  const { name, boostValue, adminId } = input;
  if (!state.admins.includes(adminId)) {
    throw new ContractError(`Only admin can add boost.`);
  }
  const boosts = state.boosts;

  if (boosts[name]) {
    throw new ContractError(`Boost with given name already exists.`);
  }

  boosts[name] = boostValue;
  return { state };
};
