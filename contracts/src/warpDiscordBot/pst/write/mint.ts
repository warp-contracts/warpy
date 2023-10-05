import { checkArgumentSet, validateString } from '../../../utils';
import { ContractAction, ContractState, ContractResult } from '../../types/types';

export const mint = async (state: ContractState, { input }: ContractAction): Promise<ContractResult> => {
  checkArgumentSet(input, 'id');
  validateString(input, 'id');

  const { id } = input;
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
