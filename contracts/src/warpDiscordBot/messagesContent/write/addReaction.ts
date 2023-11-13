import { checkArgumentSet, validateString } from '../../../utils';
import {
  ContractAction,
  ContractState,
  ContractResult,
  pointsPrefix,
  timePrefix,
  removedReactionsPrefix,
  rolesPrefix,
} from '../../types/types';
import { addTokensBalance, countBoostsPoints } from './addMessage';

export const addReaction = async (state: ContractState, { input }: ContractAction): Promise<ContractResult> => {
  checkArgumentSet(input, 'userId');
  validateString(input, 'userId');
  checkArgumentSet(input, 'roles');
  checkArgumentSet(input, 'messageId');
  validateString(input, 'messageId');
  checkArgumentSet(input, 'emojiId');
  validateString(input, 'emojiId');

  const { userId, roles, messageId, emojiId } = input;

  if (await exceedsMaxReactionsInTimeLag(state, userId)) {
    throw new ContractError(
      `User cannot sent more than ${state.reactions.max} reactions in ${state.reactions.timeLagInSeconds} seconds.`
    );
  }

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

  await SmartWeave.kv.put(
    `${pointsPrefix}${userId}_${emojiId}_${messageId}_${SmartWeave.block.timestamp}`,
    boostsPoints
  );
  await SmartWeave.kv.put(
    `${timePrefix}${userId}_${SmartWeave.block.timestamp}_${emojiId}_${messageId}`,
    `${emojiId}_${messageId}`
  );
  await SmartWeave.kv.put(`${rolesPrefix}${userId}_${emojiId}_${messageId}_${SmartWeave.block.timestamp} `, roles);

  return { state, event: { userId, roles, points: boostsPoints } };
};

const exceedsMaxReactionsInTimeLag = async (state: ContractState, userId: string) => {
  const currentTimestamp = SmartWeave.block.timestamp;
  const timeLagTimestamp = currentTimestamp - state.reactions.timeLagInSeconds;
  const timeLagReactions = await SmartWeave.kv.kvMap({
    gte: `${timePrefix}${userId}_${timeLagTimestamp}`,
    lt: `${timePrefix}${userId}_${currentTimestamp}\xff`,
  });
  const timeLagReactionsValues = [...timeLagReactions.values()];
  const timeLagReactionsKeys = [...timeLagReactions.keys()];

  const removedReactions = await SmartWeave.kv.keys({
    gte: `${removedReactionsPrefix}`,
    lt: `${removedReactionsPrefix}\xff`,
  });
  for (let i = 0; i < timeLagReactionsValues.length; i++) {
    for (let j = 0; j < removedReactions.length; j++) {
      const n = removedReactions[j].lastIndexOf('_', removedReactions[j].lastIndexOf('_') - 1);
      const removedReactionId = removedReactions[j].substring(n + 1);
      if (timeLagReactionsValues[i] == removedReactionId) {
        timeLagReactions.delete(timeLagReactionsKeys[i]);
        break;
      }
    }
  }
  return timeLagReactions.size == state.reactions.max;
};
