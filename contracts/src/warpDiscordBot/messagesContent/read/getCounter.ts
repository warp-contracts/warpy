import { ContractAction, ContractState, ContractResult, counterPrefix } from '../../types/types';

declare const ContractError;
declare const SmartWeave;

export const getCounter = async (state: ContractState, { input: { id } }: ContractAction): Promise<ContractResult> => {
  if (!id) {
    throw new ContractError('Id must be provided.');
  }

  const counter = await SmartWeave.kv.get(`${counterPrefix}${id}`);

  return { result: { counter } };
};
