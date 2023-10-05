import { checkArgumentSet, validateString } from '../../../utils';
import { ContractAction, ContractState, ContractResult, pointsPrefix } from '../../types/types';
import { addTokensBalance, countBoostsPoints } from './addMessage';

export const addReaction = async (state: ContractState, { input }: ContractAction): Promise<ContractResult> => {
  checkArgumentSet(input, 'userId');
  validateString(input, 'userId');
  checkArgumentSet(input, 'roles');
  checkArgumentSet(input, 'messageId');
  validateString(input, 'messageId');
  checkArgumentSet(input, 'emoji');
  validateString(input, 'emoji');

  const { userId, roles, messageId, emoji } = input;
  const counter = state.counter[userId];

  let boostsPoints = state.reactionsTokenWeight;
  let counterObj: { messages: number; reactions: number; boosts: string[]; points: number };
  if (counter) {
    boostsPoints *= countBoostsPoints(state, counter.boosts, roles);
    counterObj = {
      messages: counter.messages,
      reactions: counter.reactions + 1,
      boosts: counter.boosts,
      points: counter.points + boostsPoints,
    };
  } else {
    counterObj = { messages: 0, reactions: 1, boosts: [], points: state.reactionsTokenWeight };
  }

  state.counter[userId] = counterObj;

  addTokensBalance(state, userId, boostsPoints);

  const effectiveCaller = `${userId}_${emoji}_${messageId}_${SmartWeave.block.timestamp}`;
  await SmartWeave.kv.put(`${pointsPrefix}${effectiveCaller}`, boostsPoints);

  return { state };
};
