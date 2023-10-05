import { checkArgumentSet, validateString, validateTxId } from '../../utils';
import { ContractAction, ContractState, ContractResult } from '../types/types';

export const registerServer = async (state: ContractState, { input }: ContractAction): Promise<ContractResult> => {
  checkArgumentSet(input, 'serverId');
  validateString(input, 'serverId');
  checkArgumentSet(input, 'serverName');
  validateString(input, 'serverName');
  checkArgumentSet(input, 'contractTxId');
  validateString(input, 'contractTxId');
  validateTxId(input.contractTxId);

  const { serverId, serverName, contractTxId } = input;
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
