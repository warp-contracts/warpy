import { ContractAction, ContractState, ContractResult, counterPrefix } from '../../types/types';

declare const ContractError;
declare const SmartWeave;

export const addUserBoost = async (
  state: ContractState,
  { input: { id, name } }: ContractAction
): Promise<ContractResult> => {
  if (!name) {
    throw new ContractError(`Boost name should be provided.`);
  }

  if (typeof name != 'string') {
    throw new ContractError(`Boost name should be of type 'string'.`);
  }

  if (!id) {
    throw new ContractError(`User id should be provided.`);
  }

  if (typeof id != 'string') {
    throw new ContractError(`User id should be of type 'string'.`);
  }

  const counter = await SmartWeave.kv.get(`${counterPrefix}${id}`);

  let counterObj: { messages: number; reactions: number; boosts: string[]; points: 0 } = {
    messages: 0,
    reactions: 0,
    boosts: [],
    points: 0,
  };
  if (counter) {
    const newBoosts = counter.boosts.includes(name) ? counter.boosts : [...counter.boosts, name];
    counterObj = {
      messages: counter.messages,
      reactions: counter.reactions,
      boosts: newBoosts,
      points: counter.points,
    };
  } else {
    counterObj = { messages: 0, reactions: 0, boosts: [name], points: 0 };
  }
  await SmartWeave.kv.put(`${counterPrefix}${id}`, counterObj);
  state.counter[id] = counterObj;
  const userBoosts = state.counter[id].boosts;

  if (!userBoosts.includes(name)) {
    userBoosts.push(name);
  }

  return { state };
};
