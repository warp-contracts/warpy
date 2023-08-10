import {
  ContractAction,
  ContractState,
  ContractResult,
  messagesPrefix,
  counterPrefix,
  usersPrefix,
  balancesPrefix,
} from '../../types/types';
import { countBoostsPoints } from './addMessage';

declare const ContractError;
declare const SmartWeave;

export const removeMessage = async (
  state: ContractState,
  { input: { id, messageId } }: ContractAction
): Promise<ContractResult> => {
  if (!id) {
    throw new ContractError(`Caller's id should be provided.`);
  }

  if (!messageId) {
    throw new ContractError(`Message id id should be provided.`);
  }

  const message = await SmartWeave.kv.keys({
    gte: `${messagesPrefix}${id}_${messageId}`,
    lt: `${messagesPrefix}${id}_${messageId}\xff`,
  });

  if (message.length == 0) {
    throw new ContractError(`Message not found.`);
  }

  await SmartWeave.kv.del(message[0]);

  delete state.messages[message[0].substring(message[0].indexOf('.') + 1)];

  const counter = await SmartWeave.kv.get(`${counterPrefix}${id}`);
  let boostsPoints = state.messagesTokenWeight;
  boostsPoints *= countBoostsPoints(state, counter.boosts);
  const counterObj = {
    ...counter,
    messages: counter.messages - 1,
    points: counter.points - boostsPoints,
  };
  await SmartWeave.kv.put(`${counterPrefix}${id}`, counterObj);
  state.counter[id] = counterObj;

  const address = await SmartWeave.kv.get(`${usersPrefix}${id}`);
  if (address) {
    const tokens = await SmartWeave.kv.get(`${balancesPrefix}${address}`);
    await SmartWeave.kv.put(`${balancesPrefix}${address}`, tokens - boostsPoints);

    state.balances[address] = tokens - boostsPoints;
  }
  return { state };
};
