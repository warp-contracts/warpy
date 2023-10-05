import { checkArgumentSet, validateString } from '../../utils';
import { ContractAction, ContractState, ContractResult } from '../types/types';

export const removeServer = async (state: ContractState, { input }: ContractAction): Promise<ContractResult> => {
  checkArgumentSet(input, 'serverId');
  validateString(input, 'serverId');

  const { serverId } = input;
  const server = state.servers[serverId];
  if (!server) {
    throw new ContractError(`Server not found.`);
  }

  delete state.servers[serverId];

  return { state };
};
