import { checkArgumentSet, validateInteger, validateString } from '../../../utils';
import { countBoostsPoints } from '../../messagesContent/write/addMessage';
import { subtractTokensBalance } from '../../messagesContent/write/removeMessage';
import { ContractAction, ContractState, ContractResult } from '../../types/types';

export const removePoints = async (state: ContractState, { input }: ContractAction): Promise<ContractResult> => {
  checkArgumentSet(input, 'points');
  validateInteger(input, 'points');
  checkArgumentSet(input, 'adminId');
  validateString(input, 'adminId');
  checkArgumentSet(input, 'members');

  const { members, points, adminId, noBoost } = input;
  if (!state.admins.includes(adminId)) {
    throw new ContractError(`Only admin can remove points.`);
  }

  const subtractPointsEvent: { userId: string; points: number; roles: string[] }[] = [];

  for (let i = 0; i < members.length; i++) {
    const id = members[i].id;
    const roles = members[i].roles;
    let boostsPoints = points;
    if (!noBoost) {
      boostsPoints *= countBoostsPoints(state, [], roles);
    }

    subtractTokensBalance(state, id, boostsPoints);
    subtractPointsEvent.push({ userId: id, points: -boostsPoints, roles });
  }
  return { state, event: { users: subtractPointsEvent } };
};
