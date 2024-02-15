import { Collection } from 'discord.js';

declare module 'discord.js' {
  export interface Client {
    commands: Collection<any, any>;
  }
}

interface TransactionsPerTimeLag {
  [userId: string]: {
    timestamp: number;
    txId: string;
  }[];
}
