import { ContractAction, ContractState, ContractResult } from '../types/types';

declare const ContractError;
declare const SmartWeave;

export const removeServer = async (
  state: ContractState,
  { input: { serverId } }: ContractAction
): Promise<ContractResult> => {
  if (!serverId) {
    throw new ContractError(`Server id has not been provided.`);
  }

  const server = await SmartWeave.kv.get(serverId);
  if (!server) {
    throw new ContractError(`Server not found.`);
  }

  await SmartWeave.kv.del(serverId);
  delete state.servers[serverId];

  return { state };
};
