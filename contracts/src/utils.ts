import { ContractAction, ContractState } from './warpDiscordBot/types/types';

export const validateString = (input: any, argumentName: string) => {
  if (typeof input[argumentName] != 'string') {
    throw new ContractError(`${argumentName} should be of type 'string'.`);
  }
};

export const validateInteger = (input: any, argumentName: string) => {
  if (!Number.isInteger(input[argumentName])) {
    throw new ContractError(`Invalid value for '${argumentName}'. Must be an integer`);
  }
};

export const checkArgumentSet = (input: any, argumentName: string) => {
  if (!input[argumentName]) {
    throw new ContractError(`${argumentName} should be provided.`);
  }
};

export const validateTxId = (txId: string) => {
  const validTxIdRegex = /[a-z0-9_-]{43}/i;
  const isValid = validTxIdRegex.test(txId);

  if (!isValid) {
    throw new ContractError(`Incorrect contract tx id.`);
  }
};

export const LAST_HOUR_BLOCKS = 30;

export const validateOwnerFunction = (state: ContractState, action: ContractAction) => {
  if (!state.owners.includes(action.caller)) {
    throw new ContractError(`Only owner of the contract can perform interactions.`);
  }
};
