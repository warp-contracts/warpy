import { checkArgumentSet, validateString } from '../../../utils';
import { ContractAction, ContractState, ContractResult } from '../../types/types';

export const changeWallet = async (state: ContractState, { input }: ContractAction): Promise<ContractResult> => {
  checkArgumentSet(input, 'id');
  validateString(input, 'id');
  checkArgumentSet(input, 'address');
  validateString(input, 'address');

  const { id, address } = input;
  const users = state.users;

  if (!users.hasOwnProperty(id)) {
    throw new ContractError('Id not registered.');
  }

  for (let key in users) {
    if (users[key] == address) {
      throw new ContractError('Address already assigned.');
    }
  }

  const oldAddress = state.users[id];
  state.users[id] = address;

  Object.defineProperty(state.balances, address, Object.getOwnPropertyDescriptor(state.balances, oldAddress)!!);
  delete state.balances[oldAddress];

  return { state, event: { name: 'changeWallet', oldAddress, address } };
};
