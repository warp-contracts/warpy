import { validateInputArgumentPresence, validateString } from '../../../utils';
import { ContractAction, ContractState, ContractResult, messagesPrefix } from '../../types/types';
import { countBoostsPoints } from './addMessage';

declare const ContractError;
declare const SmartWeave;

export const removeMessage = async (
  state: ContractState,
  { input: { id, messageId, roles } }: ContractAction
): Promise<ContractResult> => {
  validateInputArgumentPresence(id, 'id');
  validateString(id, 'id');
  validateInputArgumentPresence(messageId, 'messageId');
  validateString(messageId, 'messageId');

  const message = await SmartWeave.kv.keys({
    gte: `${messagesPrefix}${id}_${messageId}`,
    lt: `${messagesPrefix}${id}_${messageId}\xff`,
  });

  if (message.length == 0) {
    throw new ContractError(`Message not found.`);
  }

  await SmartWeave.kv.del(message[0]);

  delete state.messages[message[0].substring(message[0].indexOf('.') + 1)];

  const counter = state.counter[id];
  let boostsPoints = state.messagesTokenWeight;
  boostsPoints *= countBoostsPoints(state, counter.boosts, roles);
  const counterObj = {
    ...counter,
    messages: counter.messages - 1,
    points: counter.points - boostsPoints,
  };
  state.counter[id] = counterObj;

  subtractTokensBalance(state, id, boostsPoints);

  return { state };
};

export const subtractTokensBalance = (state: ContractState, id: string, boostsPoints: number) => {
  const address = state.users[id];
  if (address) {
    const tokens = state.balances[address];

    state.balances[address] = tokens - boostsPoints;
  }
};
