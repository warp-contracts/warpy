import { checkArgumentSet, validateInteger, validateString } from '../../../utils';
import { addTokensBalance, countBoostsPoints } from '../../messagesContent/write/addMessage';
import { ContractAction, ContractState, ContractResult } from '../../types/types';

export const addPoints = async (state: ContractState, { input }: ContractAction): Promise<ContractResult> => {
  checkArgumentSet(input, 'adminId');
  validateString(input, 'adminId');
  checkArgumentSet(input, 'members');

  const { adminId, members, noBoost } = input;
  if (!state.admins.includes(adminId)) {
    throw new ContractError(`Only admin can award points.`);
  }

  const addPointsEvent: { userId: string; address: string; points: number; roles: string[]; balance: number }[] = [];

  for (let i = 0; i < members.length; i++) {
    const id = members[i].id;
    const roles = members[i].roles;
    const points = members[i].points || input.points;
    if (!Number.isInteger(points)) {
      throw new ContractError(`Invalid points for member ${id}`);
    }

    let boostsPoints = points;
    if (!noBoost) {
      boostsPoints *= countBoostsPoints(state, [], roles);
    }
    addTokensBalance(state, id, boostsPoints);
    addPointsEvent.push({
      userId: id,
      address: state.users[id],
      points: boostsPoints,
      roles,
      balance: state.balances[state.users[id]],
    });
  }

  return { state, event: { name: 'upsertBalance', users: addPointsEvent } };
};
