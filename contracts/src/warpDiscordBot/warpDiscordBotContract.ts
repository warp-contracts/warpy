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
import { addAdmin } from './admins/write/addAdmin';
import { removeAdmin } from './admins/write/removeAdmin';
import { removePoints } from './points/write/removePoints';
import { addSeason } from './seasons/write/addSeason';
import { addSeasonToRole } from './seasons/write/addSeasonToRole';
import { addPoints } from './points/write/addPoints';
import { playRoulette } from './roulette/playRoulette';
import { switchRoulette } from './roulette/switchRoulette';
import { addRoulettePicks } from './roulette/addRoulettePicks';
import { getRoulettePick } from './roulette/read/getRoulettePick';
import { validateOwnerFunction } from '../utils';
import { getRouletteSwitch } from './roulette/read/getRouletteSwitch';
import { clearSeasonsAndBoosts } from './general/write/clearSeasonsAndBoosts';
import { addRouletteEntry } from './roulette/addRouletteEntry';
import { getRanking } from './points/read/getRanking';
import { addPointsCsv } from './points/write/addPointsCsv';

export async function handle(state: ContractState, action: ContractAction): Promise<ContractResult> {
  const input = action.input;

  switch (input.function) {
    case 'getAddress':
      return await getAddress(state, action);
    case 'registerUser':
      validateOwnerFunction(state, action);
      return await registerUser(state, action);
    case 'evolve':
      validateOwnerFunction(state, action);
      return await evolve(state, action);
    case 'addMessage':
      validateOwnerFunction(state, action);
      return await addMessage(state, action);
    case 'addReaction':
      validateOwnerFunction(state, action);
      return await addReaction(state, action);
    case 'getCounter':
      return await getCounter(state, action);
    case 'balance':
      return await balance(state, action);
    case 'transfer':
      validateOwnerFunction(state, action);
      return await transfer(state, action);
    case 'mint':
      validateOwnerFunction(state, action);
      return await mint(state, action);
    case 'removeMessage':
      validateOwnerFunction(state, action);
      return await removeMessage(state, action);
    case 'removeReaction':
      validateOwnerFunction(state, action);
      return await removeReaction(state, action);
    case 'addBoost':
      validateOwnerFunction(state, action);
      return await addBoost(state, action);
    case 'getBoost':
      return await getBoost(state, action);
    case 'removeBoost':
      validateOwnerFunction(state, action);
      return await removeBoost(state, action);
    case 'changeBoost':
      validateOwnerFunction(state, action);
      return await changeBoost(state, action);
    case 'addUserBoost':
      validateOwnerFunction(state, action);
      return await addUserBoost(state, action);
    case 'removeUserBoost':
      validateOwnerFunction(state, action);
      return await removeUserBoost(state, action);
    case 'addPoints':
      validateOwnerFunction(state, action);
      return await addPoints(state, action);
    case 'removePoints':
      validateOwnerFunction(state, action);
      return await removePoints(state, action);
    case 'addAdmin':
      validateOwnerFunction(state, action);
      return await addAdmin(state, action);
    case 'removeAdmin':
      validateOwnerFunction(state, action);
      return await removeAdmin(state, action);
    case 'addSeason':
      validateOwnerFunction(state, action);
      return await addSeason(state, action);
    case 'addSeasonToRole':
      validateOwnerFunction(state, action);
      return await addSeasonToRole(state, action);
    case 'playRoulette':
      validateOwnerFunction(state, action);
      return await playRoulette(state, action);
    case 'switchRoulette':
      validateOwnerFunction(state, action);
      return await switchRoulette(state, action);
    case 'addRoulettePicks':
      validateOwnerFunction(state, action);
      return await addRoulettePicks(state, action);
    case 'getRoulettePick':
      return await getRoulettePick(state, action);
    case 'getRouletteSwitch':
      return await getRouletteSwitch(state);
    case 'clearSeasonsAndBoosts':
      validateOwnerFunction(state, action);
      return await clearSeasonsAndBoosts(state, action);
    case 'addRouletteEntry':
      validateOwnerFunction(state, action);
      return await addRouletteEntry(state, action);
    case 'getRanking':
      return await getRanking(state, action);
    case 'addPointsCsv':
      return await addPointsCsv(state, action);

    default:
      throw new ContractError(`No function supplied or function not recognised: "${input.function}"`);
  }
}
