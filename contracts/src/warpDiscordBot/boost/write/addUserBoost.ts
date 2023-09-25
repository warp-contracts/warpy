import { validateInputArgumentPresence, validateString } from '../../../utils';
import { ContractAction, ContractState, ContractResult, counterPrefix } from '../../types/types';

declare const ContractError;
declare const SmartWeave;

export const addUserBoost = async (
  state: ContractState,
  { input: { id, name } }: ContractAction
): Promise<ContractResult> => {
  validateInputArgumentPresence(name, 'name');
  validateString(name, 'name');
  validateInputArgumentPresence(id, 'id');
  validateString(id, 'id');

  const counter = state.counter[id];

  let counterObj: { messages: number; reactions: number; boosts: string[]; points: number } = {
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
  state.counter[id] = counterObj;
  const userBoosts = state.counter[id].boosts;

  if (!userBoosts.includes(name)) {
    userBoosts.push(name);
  }

  return { state };
};
