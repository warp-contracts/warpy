import { checkArgumentSet, validateString } from '../../utils';
import { addTokensBalance } from '../messagesContent/write/addMessage';
import { subtractTokensBalance } from '../messagesContent/write/removeMessage';
import { ContractAction, ContractResult, ContractState, WeightedOption, roulettePrefix } from '../types/types';

export const playRoulette = async (state: ContractState, { input }: ContractAction): Promise<ContractResult> => {
  checkArgumentSet(input, 'userId');
  validateString(input, 'userId');
  checkArgumentSet(input, 'roles');
  checkArgumentSet(input, 'interactionId');
  validateString(input, 'interactionId');

  const rouletteOn = state.rouletteOn;
  if (!rouletteOn) {
    throw new ContractError(`Roulette not switched on.`);
  }

  if (!state.roulettePicks) {
    throw new ContractError('Roulette picks not set.');
  }

  const { userId, interactionId, roles } = input;

  const user = state.users[userId];
  if (!user) {
    throw new ContractError(`User not found.`);
  }

  const points = state.counter[userId]?.points;

  if (!points || points < state.rouletteEntry) {
    throw new ContractError(`User does not have enough balance to enter the game. Balance: ${points || 0}.`);
  }

  state.counter[userId].points -= state.rouletteEntry;
  subtractTokensBalance(state, userId, state.rouletteEntry);

  const weightedRandomPicker = new WeightedRandomPicker(state.roulettePicks);
  const winningOption = weightedRandomPicker.pick();

  const effectiveCaller = `${userId}_${interactionId}`;

  await SmartWeave.kv.put(`${roulettePrefix}${effectiveCaller}`, winningOption);

  state.counter[userId].points += winningOption;
  addTokensBalance(state, userId, winningOption);

  const rouletteBalance = winningOption - state.rouletteEntry;

  return { state, event: { userId, points: rouletteBalance, roles } };
};

class WeightedRandomPicker {
  private options: WeightedOption[];
  private totalWeight: number;

  constructor(options: WeightedOption[]) {
    this.options = options;
    this.totalWeight = this.calculateTotalWeight();
  }

  calculateTotalWeight() {
    return this.options.reduce((total, option) => total + option.weight, 0);
  }

  pick(): number {
    const threshold = SmartWeave.vrf.randomInt(this.totalWeight);
    // const threshold = Math.random() * this.totalWeight;
    let sum = 0;

    for (const option of this.options) {
      sum += option.weight;
      if (sum >= threshold) return option.value;
    }

    throw new Error('No option picked, this should not happen with proper weights.');
  }
}
