import { ContractAction, ContractState, ContractResult } from '../../types/types';

export const getRouletteSwitch = async (state: ContractState): Promise<ContractResult> => {
  const rouletteSwitch = state.rouletteOn;
  return { result: { rouletteSwitch } };
};
