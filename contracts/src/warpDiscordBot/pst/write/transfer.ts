import { validateInputArgumentPresence, validateInteger } from '../../../utils';
import { ContractAction, ContractState, ContractResult } from '../../types/types';

declare const ContractError;

export const transfer = async (
  state: ContractState,
  { input: { target, qty }, caller }: ContractAction
): Promise<ContractResult> => {
  validateInteger(qty, 'qty');
  validateInputArgumentPresence(target, 'target');

  if (qty <= 0 || caller === target) {
    throw new ContractError('Invalid token transfer');
  }

  let callerBalance = state.balances[caller];
  callerBalance = callerBalance ? callerBalance : 0;

  if (callerBalance < qty) {
    throw new ContractError(`Caller balance not high enough to send ${qty} token(s)!`);
  }

  // Lower the token balance of the caller
  callerBalance -= qty;
  state.balances[caller] = callerBalance;

  let targetBalance = state.balances[target];
  targetBalance = targetBalance ? targetBalance : 0;

  targetBalance += qty;
  state.balances[target] = targetBalance;

  return { state };
};
