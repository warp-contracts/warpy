import { validateInputArgumentPresence, validateString } from '../../utils';
import { ContractAction, ContractState, ContractResult } from '../types/types';

declare const ContractError;

export const removeServer = async (
  state: ContractState,
  { input: { serverId } }: ContractAction
): Promise<ContractResult> => {
  validateInputArgumentPresence(serverId, 'serverId');
  validateString(serverId, 'serverId');

  const server = state.servers[serverId];
  if (!server) {
    throw new ContractError(`Server not found.`);
  }

  delete state.servers[serverId];

  return { state };
};
