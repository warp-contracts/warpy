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

export const addMessage = async (
  state: ContractState,
  { input: { id, messageId, content } }: ContractAction
): Promise<ContractResult> => {
  if (!id) {
    throw new ContractError(`Caller's id should be provided.`);
  }

  if (!messageId) {
    throw new ContractError(`Message id should be provided.`);
  }

  if (!content) {
    throw new ContractError(`No content provided.`);
  }

  let effectiveContent: string = '';
  if (content.length > 2000) {
    effectiveContent = content.substring(0, 1999);
  } else {
    effectiveContent = content;
  }

  const effectiveCaller = `${id}_${messageId}_${SmartWeave.block.timestamp}`;

  await SmartWeave.kv.put(`${messagesPrefix}${effectiveCaller}`, effectiveContent);
  state.messages[effectiveCaller] = effectiveContent;

  const counter = await SmartWeave.kv.get(`${counterPrefix}${id}`);

  let counterObj: { messages: number; reactions: number } = { messages: 0, reactions: 0 };
  if (counter) {
    counterObj = { messages: counter.messages + 1, reactions: counter.reactions };
  } else {
    counterObj = { messages: 1, reactions: 0 };
  }

  await SmartWeave.kv.put(`${counterPrefix}${id}`, counterObj);
  state.counter[id] = counterObj;

  const address = await SmartWeave.kv.get(`${usersPrefix}${id}`);
  if (address) {
    const tokens = await SmartWeave.kv.get(`${balancesPrefix}${address}`);
    const newTokensAmount = tokens ? tokens + state.messagesTokenWeight : state.messagesTokenWeight;
    await SmartWeave.kv.put(`${balancesPrefix}${address}`, newTokensAmount);

    state.balances[address] = newTokensAmount;
  }

  return { state };
};
