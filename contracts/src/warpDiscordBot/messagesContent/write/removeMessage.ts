import { checkArgumentSet, validateString } from '../../../utils';
import { ContractAction, ContractState, ContractResult, messagesPrefix, pointsPrefix } from '../../types/types';

export const removeMessage = async (state: ContractState, { input }: ContractAction): Promise<ContractResult> => {
  checkArgumentSet(input, 'userId');
  validateString(input, 'userId');
  checkArgumentSet(input, 'messageId');
  validateString(input, 'messageId');

  const { userId, messageId } = input;

  const message = await SmartWeave.kv.keys({
    gte: `${messagesPrefix}${userId}_${messageId}`,
    lt: `${messagesPrefix}${userId}_${messageId}\xff`,
  });

  const boostsPoints = await SmartWeave.kv.kvMap({
    gte: `${pointsPrefix}${userId}_${messageId}`,
    lt: `${pointsPrefix}${userId}_${messageId}\xff`,
  });
  const boostsPointsValue = [...boostsPoints.values()][0];
  const boostsPointsKey = [...boostsPoints.keys()][0];

  if (message.length == 0) {
    throw new ContractError(`Message not found.`);
  }

  await SmartWeave.kv.del(message[0]);
  await SmartWeave.kv.del(boostsPointsKey);

  const counter = state.counter[userId];
  const counterObj = {
    ...counter,
    messages: counter.messages - 1,
    points: counter.points - boostsPointsValue,
  };
  state.counter[userId] = counterObj;

  subtractTokensBalance(state, userId, boostsPointsValue);

  return { state };
};

export const subtractTokensBalance = (state: ContractState, id: string, boostsPoints: number) => {
  const address = state.users[id];
  if (address) {
    const tokens = state.balances[address];
    const pointsAfterSubtraction = tokens - boostsPoints;
    state.balances[address] = pointsAfterSubtraction >= 0 ? pointsAfterSubtraction : 0;
  }
};
