import { checkArgumentSet, validateString } from '../../../utils';
import { ContractAction, ContractState, ContractResult, counterPrefix, roulettePrefix } from '../../types/types';

export const getRoulettePick = async (state: ContractState, { input }: ContractAction): Promise<ContractResult> => {
  checkArgumentSet(input, 'userId');
  validateString(input, 'userId');
  checkArgumentSet(input, 'interactionId');
  validateString(input, 'interactionId');

  const { userId, interactionId } = input;

  const pickKey = await SmartWeave.kv.keys({
    gte: `${roulettePrefix}${userId}_${interactionId}`,
    lt: `${roulettePrefix}${userId}_${interactionId}\xff`,
  });

  const pick = await SmartWeave.kv.get(pickKey);

  return { result: { pick } };
};
