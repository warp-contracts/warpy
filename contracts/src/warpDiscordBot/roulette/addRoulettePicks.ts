import { checkArgumentSet, validateString } from '../../utils';
import { ContractAction, ContractResult, ContractState } from '../types/types';

export const addRoulettePicks = async (state: ContractState, { input }: ContractAction): Promise<ContractResult> => {
  checkArgumentSet(input, 'roulettePicks');
  checkArgumentSet(input, 'adminId');
  validateString(input, 'adminId');

  const { adminId } = input;
  if (!state.admins.includes(adminId)) {
    throw new ContractError(`Only admin can add roulette picks.`);
  }

  state.roulettePicks = input.roulettePicks;

  return { state };
};
