import { ContractAction, ContractState, ContractResult, usersPrefix } from '../../types/types';

declare const ContractError;
declare const SmartWeave;

export const getAddress = async (state: ContractState, { input: { id } }: ContractAction): Promise<ContractResult> => {
  if (!id) {
    throw new ContractError('Id must be provided.');
  }

  const effectiveId = `${usersPrefix}${id}`;
  const address = (await SmartWeave.kv.kvMap()).get(effectiveId);

  if (!address) {
    throw new ContractError('Id has no address assigned.');
  }

  return { result: { address } };
};
