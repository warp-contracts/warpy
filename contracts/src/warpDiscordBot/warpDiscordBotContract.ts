import { evolve } from './general/write/evolve';
import { registerUser } from './namesService/write/registerUser';
import { addMessage } from './messagesContent/write/addMessage';
import { addReaction } from './messagesContent/write/addReaction';
import { ContractResult, ContractAction, ContractState } from './types/types';
import { getAddress } from './namesService/read/getAddress';
import { balance } from './pst/read/balance';
import { transfer } from './pst/write/transfer';
import { removeMessage } from './messagesContent/write/removeMessage';
import { removeReaction } from './messagesContent/write/removeReaction';
import { addBoost } from './boost/write/addBoost';
import { getBoost } from './boost/read/getBoost';
import { removeBoost } from './boost/write/removeBoost';
import { changeBoost } from './boost/write/changeBoost';
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
import { addRouletteEntry } from './roulette/addRouletteEntry';
import { getRanking } from './points/read/getRanking';
import { addPointsForAddress } from './points/write/addPointsForAddress';
import { getUserId } from './namesService/read/getUserId';
import { changeWallet } from './namesService/write/changeWallet';
import { setMessagesLimit } from './general/write/setMessagesLimit';
import { addPointsWithCap } from './points/write/addPointsWithCap';

export async function handle(state: ContractState, action: ContractAction): Promise<ContractResult> {
  const input = action.input;

  validateOwnerFunction(state, action);

  switch (input.function) {
    case 'getAddress':
      return await getAddress(state, action);
    case 'getUserId':
      return await getUserId(state, action);
    case 'registerUser':
      return await registerUser(state, action);
    case 'evolve':
      return await evolve(state, action);
    case 'addMessage':
      return await addMessage(state, action);
    case 'addReaction':
      return await addReaction(state, action);
    case 'balance':
      return await balance(state, action);
    case 'transfer':
      return await transfer(state, action);
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
    case 'addSeasonToRole':
      return await addSeasonToRole(state, action);
    case 'playRoulette':
      return await playRoulette(state, action);
    case 'switchRoulette':
      return await switchRoulette(state, action);
    case 'addRoulettePicks':
      return await addRoulettePicks(state, action);
    case 'getRoulettePick':
      return await getRoulettePick(state, action);
    case 'getRouletteSwitch':
      return await getRouletteSwitch(state);
    case 'addRouletteEntry':
      return await addRouletteEntry(state, action);
    case 'getRanking':
      return await getRanking(state, action);
    case 'addPointsForAddress':
      return await addPointsForAddress(state, action);
    case 'changeWallet':
      return await changeWallet(state, action);
    case 'setMessagesLimit':
      return await setMessagesLimit(state, action);
    case 'addPointsWithCap':
      return await addPointsWithCap(state, action);

    default:
      throw new ContractError(`No function supplied or function not recognised: "${input.function}"`);
  }
}
