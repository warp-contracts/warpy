import { checkArgumentSet, validateString } from '../../../utils';
import {
  ContractAction,
  ContractState,
  ContractResult,
  messagesPrefix,
  pointsPrefix,
  rolesPrefix,
  timePrefixMessages,
  removedMessagesPrefix,
} from '../../types/types';
import { exceedsMaxTxsInTimeLag } from './addReaction';

export const addMessage = async (state: ContractState, { input }: ContractAction): Promise<ContractResult> => {
  checkArgumentSet(input, 'userId');
  validateString(input, 'userId');
  checkArgumentSet(input, 'messageId');
  validateString(input, 'messageId');
  checkArgumentSet(input, 'content');
  checkArgumentSet(input, 'roles');

  const { userId, messageId, content, roles } = input;
  let effectiveContent: string = '';
  if (content.length > 2000) {
    effectiveContent = content.substring(0, 2000);
  } else {
    effectiveContent = content;
  }

  if (
    await exceedsMaxTxsInTimeLag(
      userId,
      state.messagesLimit.timeLagInSeconds,
      timePrefixMessages,
      state.messagesLimit.max,
      removedMessagesPrefix
    )
  ) {
    throw new ContractError(
      `User cannot sent more than ${state.messagesLimit.max} messages in ${state.messagesLimit.timeLagInSeconds} seconds.`
    );
  }

  const effectiveCaller = `${userId}_${messageId}_${SmartWeave.block.timestamp}`;

  await SmartWeave.kv.put(`${messagesPrefix}${effectiveCaller}`, effectiveContent);

  const counter = state.counter[userId];

  let boostsPoints = state.messagesTokenWeight;
  let counterObj: { messages: number; reactions: number; boosts: string[]; points: number };

  const boosts = counter ? counter.boosts : [];
  boostsPoints *= countBoostsPoints(state, boosts, roles);

  if (counter) {
    counterObj = {
      messages: counter.messages + 1,
      reactions: counter.reactions,
      boosts: counter.boosts,
      points: counter.points + boostsPoints,
    };
  } else {
    counterObj = { messages: 1, reactions: 0, boosts: [], points: boostsPoints };
  }

  state.counter[userId] = counterObj;

  addTokensBalance(state, userId, boostsPoints);

  await SmartWeave.kv.put(`${pointsPrefix}${effectiveCaller}`, boostsPoints);
  await SmartWeave.kv.put(`${rolesPrefix}${effectiveCaller}`, roles);
  await SmartWeave.kv.put(`${timePrefixMessages}${userId}_${SmartWeave.block.timestamp}_${messageId}`, `${messageId}`);

  return { state, event: { userId, points: boostsPoints, roles } };
};

export const addTokensBalance = (state: ContractState, id: string, boostsPoints: number) => {
  const address = state.users[id];
  if (address) {
    const tokens = state.balances[address];
    const newTokensAmount = tokens ? tokens + boostsPoints : boostsPoints;
    state.balances[address] = newTokensAmount;
  }
};

export const countBoostsPoints = (state: ContractState, boosts: string[], roles: string[]) => {
  let points = 1;
  let boostsValue = 0;
  boosts.forEach((boost) => {
    boostsValue += state.boosts[boost];
  });
  const seasons = state.seasons;
  const currentTimestamp = Number(SmartWeave.block.timestamp);

  Object.keys(seasons).forEach((s) => {
    if (currentTimestamp >= seasons[s].from && currentTimestamp <= seasons[s].to) {
      if (seasons[s].role) {
        if (roles.includes(seasons[s].role as string)) {
          const boost = seasons[s].boost;
          const boostsPoints = state.boosts[boost];
          boostsValue += boostsPoints;
        }
      } else {
        const boost = seasons[s].boost;
        const boostsPoints = state.boosts[boost];
        boostsValue += boostsPoints;
      }
    }
  });
  points = boostsValue > 0 ? points * boostsValue : points;
  return points;
};
