import { checkArgumentSet, validateString } from '../../utils';
import { addTokensBalance } from '../messagesContent/write/addMessage';
import {
  ContractAction,
  ContractResult,
  ContractState,
  WeightedOption,
  roulettePrefix,
  timePrefix,
} from '../types/types';

const MAX_TIME_ROULETTE = 86400;
const MAX_TXS_ROULETTE = 1;

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

  if (await exceedsMaxTxsInTimeLag(userId, MAX_TIME_ROULETTE, MAX_TXS_ROULETTE)) {
    throw new ContractError(`User cannot play more than once a day.`);
  }

  const user = state.users[userId];
  if (!user) {
    throw new ContractError(`User not found.`);
  }

  const weightedRandomPicker = new WeightedRandomPicker(state.roulettePicks);
  const winningOption = weightedRandomPicker.pick();

  const effectiveCaller = `${userId}_${interactionId}`;

  await SmartWeave.kv.put(`${roulettePrefix}${effectiveCaller}`, winningOption);
  await SmartWeave.kv.put(
    `${timePrefix}${roulettePrefix}${userId}_${SmartWeave.block.timestamp}_${interactionId}`,
    `${interactionId}`
  );

  addTokensBalance(state, userId, winningOption);

  const rouletteBalance = winningOption;

  return { state, event: { userId, points: rouletteBalance, roles, interactionId, roulette: true } };
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
    let sum = 0;

    for (const option of this.options) {
      sum += option.weight;
      if (sum >= threshold) return option.value;
    }

    throw new Error('No option picked, this should not happen with proper weights.');
  }
}

const exceedsMaxTxsInTimeLag = async (userId: string, timeLagInSeconds: number, max: number) => {
  const currentTimestamp = SmartWeave.block.timestamp;
  const pastTimestamp = currentTimestamp - (currentTimestamp % timeLagInSeconds);
  const timeLagTxs = await SmartWeave.kv.kvMap({
    gte: `${timePrefix}${roulettePrefix}${userId}_${pastTimestamp}`,
    lt: `${timePrefix}${roulettePrefix}${userId}_${currentTimestamp}\xff`,
  });

  return timeLagTxs.size >= max;
};
