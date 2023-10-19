import { checkArgumentSet, validateString } from '../../../utils';
import { ContractAction, ContractState, ContractResult } from '../../types/types';

export const clearSeasonsAndBoosts = async (
  state: ContractState,
  { caller, input }: ContractAction
): Promise<ContractResult> => {
  validateString(input, 'adminId');
  checkArgumentSet(input, 'adminId');

  if (!state.admins.includes(input.adminId)) {
    throw new ContractError('Only admin can clear seasons and boosts.');
  }

  state.boosts = {};
  state.seasons = {};

  return { state };
};
