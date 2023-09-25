import { validateInputArgumentPresence, validateString } from '../../../utils';
import { ContractAction, ContractState, ContractResult, counterPrefix } from '../../types/types';

export const getCounter = async (state: ContractState, { input: { id } }: ContractAction): Promise<ContractResult> => {
  validateInputArgumentPresence(id, 'id');
  validateString(id, 'id');

  const counter = state.counter[id];

  return { result: { counter } };
};
