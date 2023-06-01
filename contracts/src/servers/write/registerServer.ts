import { ContractAction, ContractState, ContractResult } from '../types/types';

declare const ContractError;
declare const SmartWeave;

export const registerServer = async (
  state: ContractState,
  { input: { serverId, serverName, contractTxId } }: ContractAction
): Promise<ContractResult> => {
  if (!serverId) {
    throw new ContractError(`Server id has not been provided.`);
  }

  if (!serverName) {
    throw new ContractError(`Server name has not been provided.`);
  }

  if (!contractTxId) {
    throw new ContractError(`Contract id has not been provided.`);
  }

  const server = await SmartWeave.kv.get(serverId);

  if (server) {
    throw new ContractError(`Server has been already registered.`);
  }

  await SmartWeave.kv.put(serverId, { serverName, contractTxId });
  state.servers[serverId] = {
    serverName,
    contractTxId,
  };

  return { state };
};
