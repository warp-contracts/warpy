import { checkArgumentSet, validateString } from '../../../utils';
import { ContractAction, ContractState, ContractResult } from '../../types/types';

export const removeBoost = async (state: ContractState, { input }: ContractAction): Promise<ContractResult> => {
  checkArgumentSet(input, 'name');
  validateString(input, 'name');
  checkArgumentSet(input, 'adminId');
  validateString(input, 'adminId');

  const { name, adminId } = input;
  const boost = state.boosts[name];

  if (!state.admins.includes(adminId)) {
    throw new ContractError(`Only admin can remove boost.`);
  }

  if (!boost) {
    throw new ContractError(`Boost with given name does not exist.`);
  }

  delete state.boosts[name];

  return { state };
};
