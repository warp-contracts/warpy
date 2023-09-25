import { validateInputArgumentPresence, validateString } from '../../../utils';
import { ContractAction, ContractState, ContractResult } from '../../types/types';
import { countBoostsPoints } from './addMessage';
import { subtractTokensBalance } from './removeMessage';

declare const ContractError;
declare const SmartWeave;

export const removeReaction = async (
  state: ContractState,
  { input: { id, roles } }: ContractAction
): Promise<ContractResult> => {
  validateInputArgumentPresence(id, 'id');
  validateString(id, 'id');

  const counter = state.counter[id];
  let boostsPoints = state.reactionsTokenWeight;
  boostsPoints *= countBoostsPoints(state, counter.boosts, roles);
  const counterObj = {
    ...counter,
    reactions: counter.reactions - 1,
    points: counter.points - boostsPoints,
  };
  state.counter[id] = counterObj;

  subtractTokensBalance(state, id, boostsPoints);

  return { state };
};
