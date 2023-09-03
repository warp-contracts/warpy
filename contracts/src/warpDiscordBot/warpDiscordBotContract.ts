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
import { addBoost } from './boost/write/addBoost';
import { getBoost } from './boost/read/getBoost';
import { removeBoost } from './boost/write/removeBoost';
import { changeBoost } from './boost/write/changeBoost';
import { addUserBoost } from './boost/write/addUserBoost';
import { removeUserBoost } from './boost/write/removeUserBoost';
import { addPoints } from './points/write/addPoints';
import { addAdmin } from './admins/write/addAdmin';
import { removeAdmin } from './admins/write/removeAdmin';
import { removePoints } from './points/write/removePoints';
import { addSeason } from './seasons/write/addSeason';

declare const ContractError;

export async function handle(state: ContractState, action: ContractAction): Promise<ContractResult> {
  const input = action.input;

  if (state.owner != action.caller) {
    throw new ContractError(`Only owner of the contract can perform interactions.`);
  }

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
    case 'addBoost':
      return await addBoost(state, action);
    case 'getBoost':
      return await getBoost(state, action);
    case 'removeBoost':
      return await removeBoost(state, action);
    case 'changeBoost':
      return await changeBoost(state, action);
    case 'addUserBoost':
      return await addUserBoost(state, action);
    case 'removeUserBoost':
      return await removeUserBoost(state, action);
    case 'addPoints':
      return await addPoints(state, action);
    case 'removePoints':
      return await removePoints(state, action);
    case 'addAdmin':
      return await addAdmin(state, action);
    case 'removeAdmin':
      return await removeAdmin(state, action);
    case 'addSeason':
      return await addSeason(state, action);
    default:
      throw new ContractError(`No function supplied or function not recognised: "${input.function}"`);
  }
}
