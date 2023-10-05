import { checkArgumentSet, validateString } from '../../../utils';
import { ContractAction, ContractState, ContractResult, counterPrefix } from '../../types/types';

export const removeUserBoost = async (state: ContractState, { input }: ContractAction): Promise<ContractResult> => {
  checkArgumentSet(input, 'name');
  validateString(input, 'name');
  checkArgumentSet(input, 'userId');
  validateString(input, 'userId');
  checkArgumentSet(input, 'adminId');
  validateString(input, 'adminId');

  const { userId, name, adminId } = input;
  const counter = state.counter[userId];

  if (!state.admins.includes(adminId)) {
    throw new ContractError(`Only admin can remove user boost.`);
  }

  if (!counter.boosts.includes(name)) {
    throw new ContractError('Boost not found.');
  }
  counter.boosts.splice(counter.boosts.indexOf(name), 1);

  const userBoosts = state.counter[userId].boosts;

  userBoosts.splice(userBoosts.indexOf(name), 1);
  return { state };
};
