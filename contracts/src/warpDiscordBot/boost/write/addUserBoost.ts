import { checkArgumentSet, validateString } from '../../../utils';
import { ContractAction, ContractState, ContractResult, counterPrefix } from '../../types/types';

export const addUserBoost = async (state: ContractState, { input }: ContractAction): Promise<ContractResult> => {
  checkArgumentSet(input, 'name');
  validateString(input, 'name');
  checkArgumentSet(input, 'userId');
  validateString(input, 'userId');
  checkArgumentSet(input, 'adminId');
  validateString(input, 'adminId');

  const { userId, adminId, name } = input;
  if (!state.admins.includes(adminId)) {
    throw new ContractError(`Only admin can add user boost.`);
  }
  const counter = state.counter[userId];

  let counterObj: { messages: number; reactions: number; boosts: string[]; points: number };
  if (counter) {
    const newBoosts = counter.boosts.includes(name) ? counter.boosts : [...counter.boosts, name];
    counterObj = {
      messages: counter.messages,
      reactions: counter.reactions,
      boosts: newBoosts,
      points: counter.points,
    };
  } else {
    counterObj = { messages: 0, reactions: 0, boosts: [name], points: 0 };
  }
  state.counter[userId] = counterObj;

  return { state };
};
