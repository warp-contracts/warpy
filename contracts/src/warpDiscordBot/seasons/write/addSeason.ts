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

export const addSeason = async (
  state: ContractState,
  { input: { name, from, to, boost } }: ContractAction
): Promise<ContractResult> => {
  if (!name) {
    throw new ContractError(`Season name should be provided.`);
  }

  if (!from) {
    throw new ContractError(`From timestamp should be provided.`);
  }

  if (!to) {
    throw new ContractError(`To timestamp should be provided.`);
  }

  if (!boost) {
    throw new ContractError(`Boost name should be provided.`);
  }

  if (!Object.keys(state.boosts).includes(boost)) {
    throw new ContractError(`Boost with given name does not exist. Please add boost first.`);
  }

  state.seasons[name] = {
    from,
    to,
    boost,
  };
  return { state };
};
