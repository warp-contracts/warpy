import { checkArgumentSet, validateString } from '../../../utils';
import { ContractAction, ContractState, ContractResult } from '../../types/types';

export const registerUser = async (state: ContractState, { input }: ContractAction): Promise<ContractResult> => {
  checkArgumentSet(input, 'id');
  validateString(input, 'id');
  checkArgumentSet(input, 'address');
  validateString(input, 'address');

  const { id, address } = input;
  const users = state.users;

  if (users.hasOwnProperty(id)) {
    throw new ContractError('Id already assigned.');
  }

  for (let key in users) {
    if (users[key] == address) {
      throw new ContractError('Address already assigned.');
    }
  }

  state.users[id] = address;
  state.balances[address] = state.balances[address] || 0;

  return {
    state,
    event: {
      name: 'upsertBalance',
      users: [{ userId: id, address, points: state.balances[address], balance: state.balances[address], roles: [] }],
    },
  };
};
