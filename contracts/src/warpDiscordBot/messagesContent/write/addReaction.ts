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

  if (
    await exceedsMaxTxsInTimeLag(
      userId,
      state.reactions.timeLagInSeconds,
      timePrefix,
      state.reactions.max,
      removedReactionsPrefix
    )
  ) {
    throw new ContractError(
      `User cannot sent more than ${state.reactions.max} reactions in ${state.reactions.timeLagInSeconds} seconds.`
    );
  }

  let boostsPoints = state.reactionsTokenWeight;

  boostsPoints *= countBoostsPoints(state, [], roles);

  addTokensBalance(state, userId, boostsPoints);

  await SmartWeave.kv.put(
    `${pointsPrefix}${userId}_${emojiId}_${messageId}_${SmartWeave.block.timestamp}`,
    boostsPoints
  );
  await SmartWeave.kv.put(
    `${timePrefix}${userId}_${SmartWeave.block.timestamp}_${emojiId}_${messageId}`,
    `${emojiId}${messageId}`
  );
  await SmartWeave.kv.put(`${rolesPrefix}${userId}_${emojiId}_${messageId}_${SmartWeave.block.timestamp}`, roles);

  return {
    state,
    event: {
      name: 'upsertBalance',
      users: [
        {
          userId,
          address: state.users[userId],
          points: boostsPoints,
          balance: state.balances[state.users[userId]],
          roles,
        },
      ],
    },
  };
};

export const exceedsMaxTxsInTimeLag = async (
  userId: string,
  timeLagInSeconds: number,
  prefix: string,
  max: number,
  removedTxsPrefix: string
) => {
  const currentTimestamp = SmartWeave.block.timestamp;
  const pastHourTimestamp = Math.round(currentTimestamp / timeLagInSeconds) * timeLagInSeconds;
  const timeLagTxs = await SmartWeave.kv.kvMap({
    gte: `${prefix}${userId}_${pastHourTimestamp}`,
    lt: `${prefix}${userId}_${currentTimestamp}\xff`,
  });
  const timeLagValues = [...timeLagTxs.values()];
  const timeLagKeys = [...timeLagTxs.keys()];

  const removedTxs = await SmartWeave.kv.keys({
    gte: `${removedTxsPrefix}${userId}`,
    lt: `${removedTxsPrefix}${userId}\xff`,
  });
  for (let i = 0; i < timeLagValues.length; i++) {
    for (let j = 0; j < removedTxs.length; j++) {
      const removedTxId = removedTxs[j].split('_')[1];
      if (timeLagValues[i] == removedTxId) {
        timeLagTxs.delete(timeLagKeys[i]);
        break;
      }
    }
  }
  return timeLagTxs.size == max;
};
