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
  reactions: {
    max: number;
    timeLagInSeconds: number;
  };
  divisibility: number;
  rouletteEntry: number;
  roulettePicks?: WeightedOption[];
  rouletteOn: boolean;
}

export interface Season {
  from: number;
  to: number;
  boost: string;
  role?: string;
}

export interface ContractAction {
  input: ContractInput;
  caller: string;
}

export interface NameServiceResult {
  address: string;
}

export interface UserId {
  userId: string;
}

export interface MessagesContentResult {
  counter?: {
    messages: number;
    reactions: number;
    points: number;
    boosts: string[];
  };
}

export interface PstResult {
  target: string;
  ticker: string;
  balance: number;
}

export interface BoostResult {
  boost: number;
}

export interface RoulettePickResult {
  pick: number;
}

export interface RouletteSwitchResult {
  rouletteSwitch: boolean;
}

export interface RankingResult {
  ranking: {
    lp: number;
    userId: string;
    balance: number;
  }[];
  userPosition?: {
    lp: number;
    userId: string;
    balance: number;
  };
}

export type ContractReadResult =
  | NameServiceResult
  | UserId
  | MessagesContentResult
  | PstResult
  | BoostResult
  | RoulettePickResult
  | RouletteSwitchResult
  | RankingResult;

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
  from: number;
  to: number;
  boost: string;
  boostValue: number;
  roles: string[];
  role: string;
  noBoost?: boolean;
  members: { id: string; roles: string[]; txId?: string }[];
  userId: string;
  emojiId: string;
  roulettePicks: WeightedOption[];
  interactionId: string;
  rouletteEntry: number;
  limit: number;
}

export interface WeightedOption {
  value: number;
  weight: number;
}

export interface PointsEvent {
  userId: string;
  roles: string[];
  points: number;
}

export interface BatchPointsEvent {
  users: PointsEvent[];
}

export interface SeasonEvent {
  name: string;
  from: number;
  to: number;
  role?: string;
}

export type ContractEvent = PointsEvent | BatchPointsEvent | SeasonEvent;

export type ContractFunction =
  | 'addActivity'
  | 'registerUser'
  | 'getAddress'
  | 'getUserId'
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
  | 'addSeason'
  | 'addSeasonToRole'
  | 'addPointsToMultipleMembers'
  | 'playRoulette'
  | 'switchRoulette'
  | 'addRoulettePicks'
  | 'getRoulettePick'
  | 'getRouletteSwitch'
  | 'clearSeasonsAndBoosts'
  | 'addRouletteEntry'
  | 'getRanking'
  | 'addPointsForAddress';

export type ContractResult = { state: ContractState; event?: ContractEvent } | { result: ContractReadResult };

export const messagesPrefix = `messages.`;
export const reactionsPrefix = `reactions.`;
export const counterPrefix = `counter.`;
export const balancesPrefix = `balances.`;
export const usersPrefix = `users.`;
export const pointsPrefix = `points.`;
export const timePrefix = `time.`;
export const removedReactionsPrefix = `removedReactions.`;
export const roulettePrefix = `roulette.`;
export const rolesPrefix = `roles.`;
export const onChainTransactionsPrefix = `onChainTransactions.`;
