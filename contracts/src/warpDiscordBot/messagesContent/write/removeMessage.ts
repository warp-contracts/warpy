import {
  ContractAction,
  ContractState,
  ContractResult,
  messagesPrefix,
  counterPrefix,
  usersPrefix,
  balancesPrefix,
} from '../../types/types';

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

  if (!message) {
    throw new ContractError(`Message not found.`);
  }

  await SmartWeave.kv.del(message[0]);
  delete state.messages[message[0].split('_').shift().join('_')];

  const counter = await SmartWeave.kv.get(`${counterPrefix}${id}`);
  const counterObj = {
    ...counter,
    messages: counter.messages - 1,
  };
  await SmartWeave.kv.put(`${counterPrefix}${id}`, counterObj);
  state.counter[id] = counterObj;

  const address = await SmartWeave.kv.get(`${usersPrefix}${id}`);
  if (address) {
    const tokens = await SmartWeave.kv.get(`${balancesPrefix}${address}`);
    await SmartWeave.kv.put(`${balancesPrefix}${address}`, tokens - state.messagesTokenWeight);

    state.balances[address] = tokens - state.messagesTokenWeight;
  }
  return { state };
};
