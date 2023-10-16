import { checkArgumentSet, validateString } from '../../utils';
import { ContractAction, ContractResult, ContractState } from '../types/types';

export const switchRoulette = async (state: ContractState, { input }: ContractAction): Promise<ContractResult> => {
  checkArgumentSet(input, 'adminId');
  validateString(input, 'adminId');

  const { adminId } = input;
  if (!state.admins.includes(adminId)) {
    throw new ContractError(`Only admin can switch roulette.`);
  }

  state.rouletteOn = !state.rouletteOn;

  return { state };
};
