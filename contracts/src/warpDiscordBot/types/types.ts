export interface ContractState {
  owners: string[];
  serverName: string;
  creationTimestamp: number;
  name: string;
  ticker: string;
  evolve?: string;
  messagesTokenWeight: number;
  reactionsTokenWeight: number;
  balances: {
    [address: string]: number;
  };
  messages: {
    [id: string]: string;
  };
  counter: {
    [id: string]: {
      messages: number;
      reactions: number;
      points: number;
      boosts: string[];
    };
  };
  users: {
    [id: string]: string;
  };
  boosts: {
    [name: string]: number;
  };
  admins: string[];
  seasons: {
    [name: string]: Season;
  };
}

export interface Season {
  from: string;
  to: string;
  boost: string;
}

export interface ContractAction {
  input: ContractInput;
  caller: string;
}

export interface NameServiceResult {
  address: string;
}

export interface MessagesContentResult {
  counter?: { messages: number; interactions: number };
}

export interface PstResult {
  target: string;
  ticker: string;
  balance: number;
}

export interface BoostResult {
  boost: number;
}

export type ContractReadResult = NameServiceResult | MessagesContentResult | PstResult | BoostResult;

export interface ContractInput {
  function: ContractFunction;
  name: string;
  address: string;
  value: string;
  args: {
    serverName: string;
    name: string;
    ticker: string;
    creationTimestamp: number;
    owner: string;
    messagesTokenWeight: number;
    reactionsTokenWeight: number;
  };
  content: string;
  target: string;
  qty: number;
  id: string;
  messageId: string;
  points: number;
  adminId: string;
  from: string;
  to: string;
  boost: string;
}

export type ContractFunction =
  | 'addActivity'
  | 'registerUser'
  | 'getAddress'
  | 'evolve'
  | 'transfer'
  | 'mint'
  | 'balance'
  | 'addMessage'
  | 'addReaction'
  | 'getCounter'
  | 'removeMessage'
  | 'removeReaction'
  | 'addBoost'
  | 'getBoost'
  | 'removeBoost'
  | 'changeBoost'
  | 'addUserBoost'
  | 'removeUserBoost'
  | 'addPoints'
  | 'removePoints'
  | 'addAdmin'
  | 'removeAdmin'
  | 'addSeason';

export type ContractResult = { state: ContractState } | { result: ContractReadResult };

export const messagesPrefix = `messages.`;
export const counterPrefix = `counter.`;
export const balancesPrefix = `balances.`;
export const usersPrefix = `users.`;
