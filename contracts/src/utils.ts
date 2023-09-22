declare const ContractError;

export const validateString = (value: any, valueName: string) => {
  if (typeof value != 'string') {
    throw new ContractError(`${valueName} should be of type 'string'.`);
  }
};

export const validateInteger = (value: any, valueName: string) => {
  if (!Number.isInteger(value)) {
    throw new ContractError(`Invalid value for '${valueName}'. Must be an integer`);
  }
};

export const validateInputArgumentPresence = (argument: any, argumentName: string) => {
  if (!argument) {
    throw new ContractError(`${argumentName} should be provided.`);
  }
};
