import { validateInputArgumentPresence, validateInteger, validateString } from '../../../utils';
import { addTokensBalance, countBoostsPoints } from '../../messagesContent/write/addMessage';
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

export const addPoints = async (
  state: ContractState,
  { input: { points, adminId, members, noBoost } }: ContractAction
): Promise<ContractResult> => {
  validateInputArgumentPresence(points, 'points');
  validateInteger(points, 'points');
  validateInputArgumentPresence(adminId, 'adminId');
  validateString(adminId, 'adminId');
  validateInputArgumentPresence(members, 'members');

  if (!state.admins.includes(adminId)) {
    throw new ContractError(`Only admin can award points.`);
  }

  for (let i = 0; i < members.length; i++) {
    const id = members[i].id;
    const roles = members[i].roles;
    const counter = state.counter[id];

    let boostsPoints = points;
    let counterObj: { messages: number; reactions: number; boosts: string[]; points: number } = {
      messages: 0,
      reactions: 0,
      boosts: [],
      points: 0,
    };
    if (counter) {
      if (!noBoost) {
        boostsPoints *= countBoostsPoints(state, counter.boosts, roles);
      }
      counterObj = {
        messages: counter.messages,
        reactions: counter.reactions,
        boosts: counter.boosts,
        points: counter.points + boostsPoints,
      };
    } else {
      counterObj = { messages: 0, reactions: 0, boosts: [], points: boostsPoints };
    }

    state.counter[id] = counterObj;

    addTokensBalance(state, id, boostsPoints);
  }

  return { state };
};
