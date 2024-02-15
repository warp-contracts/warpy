import { Message } from 'discord.js';
import { Tag, Warp } from 'warp-contracts';
import { connectToServerContract, getStateFromDre } from '../utils';
import { TransactionsPerTimeLag } from '../types/discord';

export default {
  name: 'messageDelete',
  async execute(message: Message, warp: Warp, wallet: any, messagesPerTimeLag: TransactionsPerTimeLag) {
    if (message.author.bot) return;
    if (message.content == '') {
      return;
    } else {
      deleteFromLimitedTransactionsIfExists(messagesPerTimeLag, message.author.id, message.id, 'message');
      const userMessages = messagesPerTimeLag[message.author.id];
      if (userMessages) {
        const userMessage = userMessages.find((m) => m.txId == message.id);
        if (userMessage) {
          const userMessagesSliced = userMessages.slice(userMessages.indexOf(userMessage), 1);
          messagesPerTimeLag[message.author.id] = userMessagesSliced;
        }
      }
      const contract = await connectToServerContract(warp, wallet, message.guildId);
      try {
        const result = (await getStateFromDre(contract.txId(), 'users', message.author.id)).result[0];
        if (result.length == 0) {
          return;
        }
      } catch (e) {
        return;
      }
      await contract.writeInteraction(
        {
          function: 'removeMessage',
          userId: message.author.id,
          messageId: message.id,
          roles: message.member?.roles.cache.map((r) => r.name),
        },
        {
          tags: [new Tag('Indexed-By', `message-remove;${message.author.id};${message.guildId};`)],
        }
      );
    }
  },
};

export const deleteFromLimitedTransactionsIfExists = (
  transactionsPerTimeLag: TransactionsPerTimeLag,
  userId: string,
  transactionId: string,
  transactionType: 'message' | 'reaction'
) => {
  const userTransactions = transactionsPerTimeLag[userId];
  if (userTransactions) {
    const userTransaction = userTransactions.find((t) => t.txId == transactionId);
    if (userTransaction) {
      const userTransactionsSliced = userTransactions.slice(userTransactions.indexOf(userTransaction), 1);
      transactionsPerTimeLag[userId] = userTransactionsSliced;
      console.info(
        `Transaction deleted from ${transactionType}. User id: ${transactionId}, transaction id: ${userId}.`
      );
    }
  }
};
