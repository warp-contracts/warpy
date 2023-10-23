import { checkArgumentSet, validateInteger, validateString } from '../../utils';
import { ContractAction, ContractResult, ContractState } from '../types/types';

export const addRouletteEntry = async (state: ContractState, { input }: ContractAction): Promise<ContractResult> => {
  checkArgumentSet(input, 'rouletteEntry');
  validateInteger(input, 'rouletteEntry');
  checkArgumentSet(input, 'adminId');
  validateString(input, 'adminId');

  const { adminId, rouletteEntry } = input;
  if (!state.admins.includes(adminId)) {
    throw new ContractError(`Only admin can add roulette picks.`);
  }

  state.rouletteEntry = rouletteEntry;

  return { state };
};
