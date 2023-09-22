import { validateInputArgumentPresence, validateInteger, validateString } from '../../../utils';
import { countBoostsPoints } from '../../messagesContent/write/addMessage';
import { subtractTokensBalance } from '../../messagesContent/write/removeMessage';
import {
  ContractAction,
  ContractState,
  ContractResult,
  counterPrefix,
  usersPrefix,
  balancesPrefix,
} from '../../types/types';

declare const ContractError;
declare const SmartWeave;

export const removePoints = async (
  state: ContractState,
  { input: { members, points, adminId, noBoost } }: ContractAction
): Promise<ContractResult> => {
  validateInputArgumentPresence(points, 'points');
  validateInteger(points, 'points');
  validateInputArgumentPresence(adminId, 'adminId');
  validateString(adminId, 'adminId');
  validateInputArgumentPresence(members, 'members');

  if (!state.admins.includes(adminId)) {
    throw new ContractError(`Only admin can remove points.`);
  }

  for (let i = 0; i < members.length; i++) {
    const id = members[i].id;
    const roles = members[i].roles;
    const counter = state.counter[id];
    let boostsPoints = points;
    if (!noBoost) {
      boostsPoints *= countBoostsPoints(state, counter.boosts, roles);
    }
    const counterObj = {
      ...counter,
      points: counter.points - boostsPoints,
    };
    state.counter[id] = counterObj;

    subtractTokensBalance(state, id, boostsPoints);
  }
  return { state };
};
