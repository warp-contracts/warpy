import { validateInputArgumentPresence, validateString } from '../../../utils';
import { ContractAction, ContractState, ContractResult, messagesPrefix, counterPrefix } from '../../types/types';

declare const ContractError;
declare const SmartWeave;

export const addMessage = async (
  state: ContractState,
  { input: { id, messageId, content, roles } }: ContractAction
): Promise<ContractResult> => {
  validateInputArgumentPresence(id, 'id');
  validateString(id, 'id');
  validateInputArgumentPresence(messageId, 'messageId');
  validateString(messageId, 'messageId');
  validateInputArgumentPresence(content, 'content');
  validateInputArgumentPresence(roles, 'roles');

  let effectiveContent: string = '';
  if (content.length > 2000) {
    effectiveContent = content.substring(0, 1999);
  } else {
    effectiveContent = content;
  }

  const effectiveCaller = `${id}_${messageId}_${SmartWeave.block.timestamp}`;

  await SmartWeave.kv.put(`${messagesPrefix}${effectiveCaller}`, effectiveContent);

  const counter = state.counter[id];

  let boostsPoints = state.messagesTokenWeight;
  let counterObj: { messages: number; reactions: number; boosts: string[]; points: number } = {
    messages: 0,
    reactions: 0,
    boosts: [],
    points: 0,
  };

  const boosts = counter ? counter.boosts : [];
  boostsPoints *= countBoostsPoints(state, boosts, roles);

  if (counter) {
    counterObj = {
      messages: counter.messages + 1,
      reactions: counter.reactions,
      boosts: counter.boosts,
      points: counter.points + boostsPoints,
    };
  } else {
    counterObj = { messages: 1, reactions: 0, boosts: [], points: boostsPoints };
  }

  state.counter[id] = counterObj;

  addTokensBalance(state, id, boostsPoints);

  return { state };
};

export const addTokensBalance = (state: ContractState, id: string, boostsPoints: number) => {
  const address = state.users[id];
  if (address) {
    const tokens = state.balances[address];
    const newTokensAmount = tokens ? tokens + boostsPoints : boostsPoints;
    state.balances[address] = newTokensAmount;
  }
};

export const countBoostsPoints = (state: ContractState, boosts: string[], roles: string[]) => {
  let points = 1;
  boosts.forEach((boost) => {
    points *= state.boosts[boost];
  });
  const seasons = state.seasons;
  const currentTimestamp = Number(SmartWeave.block.timestamp);

  Object.keys(seasons).forEach((s) => {
    if (currentTimestamp >= seasons[s].from && currentTimestamp <= seasons[s].to) {
      if (seasons[s].role) {
        if (roles.includes(seasons[s].role as string)) {
          const boost = seasons[s].boost;
          const boostsPoints = state.boosts[boost];
          points *= boostsPoints;
        }
      } else {
        const boost = seasons[s].boost;
        const boostsPoints = state.boosts[boost];
        points *= boostsPoints;
      }
    }
  });
  return points;
};
