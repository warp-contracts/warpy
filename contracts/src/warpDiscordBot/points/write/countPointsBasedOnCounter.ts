import { addTokensBalance } from '../../messagesContent/write/addMessage';
import { ContractAction, ContractState, ContractResult } from '../../types/types';

export const countPointsBasedOnCounter = async (
  state: ContractState,
  { input }: ContractAction
): Promise<ContractResult> => {
  const { adminId } = input;
  if (!state.admins.includes(adminId)) {
    throw new ContractError(`Only admin can award points.`);
  }

  const users = Object.keys(state.counter);
  for (let i = 0; i < users.length; i++) {
    let counter = state.counter[users[i]];
    const messages = counter.messages;
    const reactions = counter.reactions;
    const points = messages * state.messagesTokenWeight + reactions * state.reactionsTokenWeight;

    const counterObj = {
      messages,
      reactions,
      boosts: counter.boosts,
      points,
    };

    state.counter[users[i]] = counterObj;

    const address = state.users[users[i]];
    state.balances[address] = points;
  }

  return { state };
};
