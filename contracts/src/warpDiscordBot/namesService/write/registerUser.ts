import { ContractAction, ContractState, ContractResult, usersPrefix } from '../../types/types';

declare const ContractError;
declare const SmartWeave;

export const registerUser = async (
  state: ContractState,
  { input: { id, address } }: ContractAction
): Promise<ContractResult> => {
  if (!id) {
    throw new ContractError('Id must be provided.');
  }

  if (!address) {
    throw new ContractError('Address must be provided.');
  }

  const effectiveId = `${usersPrefix}${id}`;

  const users = await SmartWeave.kv.keys();

  if (users.includes(effectiveId)) {
    throw new Error('Id already assigned.');
  }

  const idsAddressesMap = await SmartWeave.kv.kvMap();

  if (idsAddressesMap.size > 0 && [...idsAddressesMap.values()].includes(address)) {
    throw new Error('Address already assigned.');
  }

  await SmartWeave.kv.put(effectiveId, address);
  state.users[id] = address;

  return { state };
};
