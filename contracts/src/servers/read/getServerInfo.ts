import { checkArgumentSet, validateString } from '../../utils';
import { ContractAction, ContractState, ContractResult } from '../types/types';

export const getServerInfo = async (state: ContractState, { input }: ContractAction): Promise<ContractResult> => {
  checkArgumentSet(input, 'serverId');
  validateString(input, 'serverId');

  const serverId = input.serverId;
  const server = state.servers[serverId];

  return {
    result: { serverId, serverName: server?.serverName, contractTxId: server?.contractTxId },
  };
};
