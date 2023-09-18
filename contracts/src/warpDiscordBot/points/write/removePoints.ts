import { countBoostsPoints } from '../../messagesContent/write/addMessage';
import {
  ContractAction,
  ContractState,
  ContractResult,
  counterPrefix,
  usersPrefix,
  balancesPrefix,
} from '../../types/types';

declare const ContractError;
declare const SmartWeave;

export const removePoints = async (
  state: ContractState,
  { input: { members, points, adminId, noBoost } }: ContractAction
): Promise<ContractResult> => {
  if (!members) {
    throw new ContractError(`No members provided.`);
  }

  if (!points) {
    throw new ContractError(`Points should be provided.`);
  }

  if (!adminId) {
    throw new ContractError(`Caller's id should be provided.`);
  }

  if (!state.admins.includes(adminId)) {
    throw new ContractError(`Only admin can remove points.`);
  }

  for (let i = 0; i < members.length; i++) {
    const id = members[i].id;
    const roles = members[i].roles;
    const counter = await SmartWeave.kv.get(`${counterPrefix}${id}`);
    let boostsPoints = points;
    if (!noBoost) {
      boostsPoints *= countBoostsPoints(state, counter.boosts, roles);
    }
    const counterObj = {
      ...counter,
      points: counter.points - boostsPoints,
    };
    await SmartWeave.kv.put(`${counterPrefix}${id}`, counterObj);
    state.counter[id] = counterObj;

    const address = await SmartWeave.kv.get(`${usersPrefix}${id}`);
    if (address) {
      const tokens = await SmartWeave.kv.get(`${balancesPrefix}${address}`);
      await SmartWeave.kv.put(`${balancesPrefix}${address}`, tokens - boostsPoints);

      state.balances[address] = tokens - boostsPoints;
    }
  }
  return { state };
};
