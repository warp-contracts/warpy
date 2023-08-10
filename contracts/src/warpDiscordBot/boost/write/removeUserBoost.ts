import { ContractAction, ContractState, ContractResult, counterPrefix } from '../../types/types';

declare const ContractError;
declare const SmartWeave;

export const removeUserBoost = async (
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

  if (!counter.boosts.includes(name)) {
    throw new ContractError('Boost not found.');
  }
  counter.boosts.splice(counter.boosts.indexOf(name), 1);
  await SmartWeave.kv.put(`${counterPrefix}${id}`, counter);

  const userBoosts = state.counter[id].boosts;

  userBoosts.splice(userBoosts.indexOf(name), 1);
  return { state };
};
