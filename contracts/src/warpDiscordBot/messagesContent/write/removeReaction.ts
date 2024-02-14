import { checkArgumentSet, validateString } from '../../../utils';
import {
  ContractAction,
  ContractState,
  ContractResult,
  pointsPrefix,
  removedReactionsPrefix,
  rolesPrefix,
} from '../../types/types';
import { subtractTokensBalance } from './removeMessage';

export const removeReaction = async (state: ContractState, { input }: ContractAction): Promise<ContractResult> => {
  checkArgumentSet(input, 'userId');
  validateString(input, 'userId');
  checkArgumentSet(input, 'messageId');
  validateString(input, 'messageId');
  checkArgumentSet(input, 'emojiId');
  validateString(input, 'emojiId');

  const { userId, messageId, emojiId } = input;

  const counter = state.counter[userId];
  const boostsPoints = await SmartWeave.kv.kvMap({
    gte: `${pointsPrefix}${userId}_${emojiId}_${messageId}`,
    lt: `${pointsPrefix}${userId}_${emojiId}_${messageId}\xff`,
  });

  const boostsPointsValue = [...boostsPoints.values()][0];
  const boostsPointsKey = [...boostsPoints.keys()][0];

  const roles = await SmartWeave.kv.kvMap({
    gte: `${rolesPrefix}${userId}_${emojiId}_${messageId}`,
    lt: `${rolesPrefix}${userId}_${emojiId}_${messageId}\xff`,
  });
  const rolesValue = [...roles.values()][0];
  const rolesKey = [...roles.keys()][0];

  if (boostsPoints.size == 0) {
    throw new ContractError('Reaction not found.');
  }

  await SmartWeave.kv.del(boostsPointsKey);
  await SmartWeave.kv.put(`${removedReactionsPrefix}${userId}_${emojiId}${messageId}`, 'removed');
  await SmartWeave.kv.del(rolesKey);

  const counterObj = {
    ...counter,
    reactions: counter.reactions - 1,
    points: counter.points - boostsPointsValue,
  };
  state.counter[userId] = counterObj;

  subtractTokensBalance(state, userId, boostsPointsValue);

  return { state, event: { userId, roles: rolesValue, points: -boostsPointsValue } };
};
