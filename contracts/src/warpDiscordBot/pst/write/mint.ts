import { validateInputArgumentPresence, validateString } from '../../../utils';
import { ContractAction, ContractState, ContractResult } from '../../types/types';

declare const ContractError;

export const mint = async (state: ContractState, { input: { id } }: ContractAction): Promise<ContractResult> => {
  validateInputArgumentPresence(id, 'id');
  validateString(id, 'id');

  const address = state.users[id];

  if (!address) {
    throw new ContractError(`User is not registered in the name service.`);
  }

  const counter = state.counter[id];
  if (counter) {
    const tokens = counter.points;
    state.balances[address] = tokens;
  }

  return { state };
};
