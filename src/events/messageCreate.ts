import { Message } from 'discord.js';

import { Tag, Warp } from 'warp-contracts';
import { connectToServerContract, getStateFromDre } from '../utils';
import { TransactionsPerTimeLag } from '../types/discord';

const MESSAGES_LIMIT = 10;
const MESSAGES_TIMESTAMP_LIMIT = 3600000;

export default {
  name: 'messageCreate',
  async execute(message: Message, warp: Warp, wallet: any, messagesPerTimeLag: TransactionsPerTimeLag) {
    if (message.author.bot) return;

    if (message.content == '') {
      return;
    } else {
      limitTransactionsPerTimeLag(
        MESSAGES_TIMESTAMP_LIMIT,
        messagesPerTimeLag,
        message.author.id,
        message.createdTimestamp,
        message.id,
        MESSAGES_LIMIT,
        'message'
      );
      const contract = await connectToServerContract(warp, wallet, message.guildId);
      try {
        const result = (await getStateFromDre(contract.txId(), 'users', message.author.id)).result;
        if (!result) {
          return;
        }
      } catch (e) {
        return;
      }
      await contract.writeInteraction(
        {
          function: 'addMessage',
          userId: message.author.id,
          content: message.content,
          messageId: message.id,
          roles: message.member?.roles.cache.map((r) => r.name),
        },
        {
          tags: [new Tag('Indexed-By', `message-add;${message.author.id};${message.guildId};`)],
        }
      );
    }
  },
};

export const limitTransactionsPerTimeLag = (
  timestampLimit: number,
  transactions: TransactionsPerTimeLag,
  userId: string,
  transactionTimestamp: number,
  transactionId: string,
  transactionsLimit: number,
  typeOfTransaction: 'message' | 'reaction'
) => {
  const currentTimestamp = Date.now();
  const limitedTimestamp = currentTimestamp - timestampLimit;
  const userTransactions = transactions[userId];
  if (userTransactions) {
    const userTransactionsLimited = userTransactions.filter((m) => m.timestamp >= limitedTimestamp);
    transactions[userId] = userTransactionsLimited;
    if (userTransactions.length < transactionsLimit) {
      transactions[userId].push({ timestamp: transactionTimestamp, txId: transactionId });
    } else {
      console.warn(
        `Skipping ${typeOfTransaction} sending. Trasaction author: ${userId}, transaction id: ${transactionId}.`
      );
      return;
    }
  } else {
    console.info(`Adding user to ${typeOfTransaction} transactionsPerTimeLag: ${userId}.`);
    transactions[userId] = [{ timestamp: transactionTimestamp, txId: transactionId }];
    // console.dir(transactions, { depth: null });
  }
};
