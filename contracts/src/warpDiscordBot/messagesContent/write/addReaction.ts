import { validateInputArgumentPresence, validateString } from '../../../utils';
import { ContractAction, ContractState, ContractResult } from '../../types/types';
import { addTokensBalance, countBoostsPoints } from './addMessage';

declare const ContractError;

export const addReaction = async (
  state: ContractState,
  { input: { id, roles } }: ContractAction
): Promise<ContractResult> => {
  validateInputArgumentPresence(id, 'id');
  validateString(id, 'id');
  validateInputArgumentPresence(roles, 'roles');

  const counter = state.counter[id];

  let boostsPoints = state.reactionsTokenWeight;
  let counterObj: { messages: number; reactions: number; boosts: string[]; points: number } = {
    messages: 0,
    reactions: 0,
    points: 0,
    boosts: [],
  };
  if (counter) {
    boostsPoints *= countBoostsPoints(state, counter.boosts, roles);
    counterObj = {
      messages: counter.messages,
      reactions: counter.reactions + 1,
      boosts: counter.boosts,
      points: counter.points + boostsPoints,
    };
  } else {
    counterObj = { messages: 0, reactions: 1, boosts: [], points: state.reactionsTokenWeight };
  }

  state.counter[id] = counterObj;

  addTokensBalance(state, id, boostsPoints);

  return { state };
};
