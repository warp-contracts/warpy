import { validateInputArgumentPresence, validateString } from '../../utils';
import { ContractAction, ContractState, ContractResult } from '../types/types';

declare const ContractError;

export const registerServer = async (
  state: ContractState,
  { input: { serverId, serverName, contractTxId } }: ContractAction
): Promise<ContractResult> => {
  validateInputArgumentPresence(serverId, 'serverId');
  validateString(serverId, 'serverId');
  validateInputArgumentPresence(serverName, 'serverName');
  validateString(serverName, 'serverName');
  validateInputArgumentPresence(contractTxId, 'contractTxId');
  validateString(contractTxId, 'contractTxId');

  const server = state.servers[serverId];

  if (server) {
    throw new ContractError(`Server has been already registered.`);
  }

  state.servers[serverId] = {
    serverName,
    contractTxId,
  };

  return { state };
};
