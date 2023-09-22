import { validateInputArgumentPresence, validateString } from '../../utils';
import { ContractAction, ContractState, ContractResult } from '../types/types';

export const getServerInfo = async (
  state: ContractState,
  { input: { serverId } }: ContractAction
): Promise<ContractResult> => {
  validateInputArgumentPresence(serverId, 'serverId');
  validateString(serverId, 'serverId');

  const server = state.servers[serverId];

  return { result: { serverId, serverName: server?.serverName || null, contractTxId: server?.contractTxId || null } };
};
