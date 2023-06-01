import { evolve } from './general/write/evolve';
import { registerUser } from './namesService/write/registerUser';
import { addMessage } from './messagesContent/write/addMessage';
import { addReaction } from './messagesContent/write/addReaction';
import { ContractResult, ContractAction, ContractState } from './types/types';
import { getAddress } from './namesService/read/getAddress';
import { getCounter } from './messagesContent/read/getCounter';
import { balance } from './pst/read/balance';
import { mint } from './pst/write/mint';
import { transfer } from './pst/write/transfer';
import { removeMessage } from './messagesContent/write/removeMessage';
import { removeReaction } from './messagesContent/write/removeReaction';

declare const ContractError;

export async function handle(state: ContractState, action: ContractAction): Promise<ContractResult> {
  const input = action.input;

  switch (input.function) {
    case 'getAddress':
      return await getAddress(state, action);
    case 'registerUser':
      return await registerUser(state, action);
    case 'evolve':
      return await evolve(state, action);
    case 'addMessage':
      return await addMessage(state, action);
    case 'addReaction':
      return await addReaction(state, action);
    case 'getCounter':
      return await getCounter(state, action);
    case 'balance':
      return await balance(state, action);
    case 'transfer':
      return await transfer(state, action);
    case 'mint':
      return await mint(state, action);
    case 'removeMessage':
      return await removeMessage(state, action);
    case 'removeReaction':
      return await removeReaction(state, action);
    default:
      throw new ContractError(`No function supplied or function not recognised: "${input.function}"`);
  }
}
