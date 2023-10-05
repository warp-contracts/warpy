import { checkArgumentSet, validateString } from '../../../utils';
import { ContractAction, ContractState, ContractResult, pointsPrefix } from '../../types/types';
import { subtractTokensBalance } from './removeMessage';

export const removeReaction = async (state: ContractState, { input }: ContractAction): Promise<ContractResult> => {
  checkArgumentSet(input, 'userId');
  validateString(input, 'userId');
  checkArgumentSet(input, 'messageId');
  validateString(input, 'messageId');
  checkArgumentSet(input, 'emoji');
  validateString(input, 'emoji');

  const { userId, messageId, emoji } = input;

  const counter = state.counter[userId];
  const boostsPoints = await SmartWeave.kv.kvMap({
    gte: `${pointsPrefix}${userId}_${emoji}_${messageId}`,
    lt: `${pointsPrefix}${userId}_${emoji}_${messageId}\xff`,
  });

  const boostsPointsValue = [...boostsPoints.values()][0];
  const boostsPointsKey = [...boostsPoints.keys()][0];
  await SmartWeave.kv.del(boostsPointsKey);

  const counterObj = {
    ...counter,
    reactions: counter.reactions - 1,
    points: counter.points - boostsPointsValue,
  };
  state.counter[userId] = counterObj;

  subtractTokensBalance(state, userId, boostsPointsValue);

  return { state };
};
