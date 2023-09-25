import { ContractResult, ContractAction, ContractState } from './types/types';
import { registerServer } from './write/registerServer';
import { getServerInfo } from './read/getServerInfo';
import { removeServer } from './write/removeServer';

declare const ContractError;

export async function handle(state: ContractState, action: ContractAction): Promise<ContractResult> {
  const input = action.input;

  switch (input.function) {
    case 'registerServer':
      return await registerServer(state, action);
    case 'getServerInfo':
      return await getServerInfo(state, action);
    case 'removeServer':
      return await removeServer(state, action);
    default:
      throw new ContractError(`No function supplied or function not recognised: "${input.function}"`);
  }
}
