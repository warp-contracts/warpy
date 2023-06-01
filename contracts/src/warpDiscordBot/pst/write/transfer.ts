import { ContractAction, ContractState, ContractResult, balancesPrefix } from '../../types/types';

declare const ContractError;
declare const SmartWeave;

export const transfer = async (
  state: ContractState,
  { input: { target, qty }, caller }: ContractAction
): Promise<ContractResult> => {
  if (!Number.isInteger(qty)) {
    throw new ContractError('Invalid value for "qty". Must be an integer');
  }

  if (!target) {
    throw new ContractError('No target specified');
  }

  if (qty <= 0 || caller === target) {
    throw new ContractError('Invalid token transfer');
  }

  let callerBalance = await SmartWeave.kv.get(`${balancesPrefix}${caller}`);
  callerBalance = callerBalance ? callerBalance : 0;

  if (callerBalance < qty) {
    throw new ContractError(`Caller balance not high enough to send ${qty} token(s)!`);
  }

  // Lower the token balance of the caller
  callerBalance -= qty;
  await SmartWeave.kv.put(`${balancesPrefix}${caller}`, callerBalance);
  state.balances[caller] = callerBalance;

  let targetBalance = await SmartWeave.kv.get(`${balancesPrefix}${target}`);
  targetBalance = targetBalance ? targetBalance : 0;

  targetBalance += qty;
  await SmartWeave.kv.put(`${balancesPrefix}${target}`, targetBalance);
  state.balances[target] = targetBalance;

  return { state };
};
