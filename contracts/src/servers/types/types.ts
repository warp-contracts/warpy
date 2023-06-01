export interface ContractState {
  owner: string;
  evolve?: string;
  servers: {
    [serverId: string]: {
      serverName: string;
      contractTxId: string;
    };
  };
}

export interface ContractAction {
  input: ContractInput;
  caller: string;
}

export type ContractReadResult = {
  serverId: string;
  serverName: string;
  contractTxId: string;
};

export interface ContractInput {
  function: ContractFunction;
  serverId: string;
  serverName: string;
  contractTxId: string;
}

export type ContractFunction = 'registerServer' | 'getServerInfo' | 'removeServer';

export type ContractResult = { state: ContractState } | { result: ContractReadResult };
