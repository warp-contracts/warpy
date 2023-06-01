import { ContractAction, ContractState, ContractResult } from '../types/types';

declare const ContractError;
declare const SmartWeave;

export const getServerInfo = async (
  state: ContractState,
  { input: { serverId } }: ContractAction
): Promise<ContractResult> => {
  const server = await SmartWeave.kv.get(serverId);

  return { result: { serverId, serverName: server?.serverName || null, contractTxId: server?.contractTxId || null } };
};
