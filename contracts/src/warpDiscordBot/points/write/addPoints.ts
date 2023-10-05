import { checkArgumentSet, validateInteger, validateString } from '../../../utils';
import { addTokensBalance, countBoostsPoints } from '../../messagesContent/write/addMessage';
import { ContractAction, ContractState, ContractResult } from '../../types/types';

export const addPoints = async (state: ContractState, { input }: ContractAction): Promise<ContractResult> => {
  checkArgumentSet(input, 'points');
  validateInteger(input, 'points');
  checkArgumentSet(input, 'adminId');
  validateString(input, 'adminId');
  checkArgumentSet(input, 'members');

  const { points, adminId, members, noBoost } = input;
  if (!state.admins.includes(adminId)) {
    throw new ContractError(`Only admin can award points.`);
  }

  for (let i = 0; i < members.length; i++) {
    const id = members[i].id;
    const roles = members[i].roles;
    const counter = state.counter[id];

    let boostsPoints = points;
    let counterObj: { messages: number; reactions: number; boosts: string[]; points: number };
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
