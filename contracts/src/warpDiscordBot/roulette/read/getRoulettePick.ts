import { checkArgumentSet, validateString } from '../../../utils';
import { ContractAction, ContractState, ContractResult, roulettePrefix } from '../../types/types';

export const getRoulettePick = async (state: ContractState, { input }: ContractAction): Promise<ContractResult> => {
  checkArgumentSet(input, 'userId');
  validateString(input, 'userId');
  checkArgumentSet(input, 'interactionId');
  validateString(input, 'interactionId');

  const { userId, interactionId } = input;

  const pick = await SmartWeave.kv.get(`${roulettePrefix}${userId}_${interactionId}`);

  return { result: { pick } };
};
