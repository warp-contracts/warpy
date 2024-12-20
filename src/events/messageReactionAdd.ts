import { User } from 'discord.js';
import { JWKInterface, Tag, Warp } from 'warp-contracts';
import { connectToServerContract, getStateFromDre } from '../utils';
import { TransactionsPerTimeLag } from '../types/discord';

const REACTIONS_LIMIT = 10;

export default {
  name: 'messageReactionAdd',
  async execute(
    reactionOrigin: any,
    user: User,
    burst: number,
    warp: Warp,
    wallet: JWKInterface,
    reactionsPerTimeLag: TransactionsPerTimeLag
  ) {
    if (user.bot) return;

    const emojiId = reactionOrigin.emoji.name.replace(/\p{Emoji}/gu, (m: any) => m.codePointAt(0).toString(16));

    if (
      !limitTransactionsPerTimeLag(
        reactionsPerTimeLag,
        user.id,
        Date.now(),
        `${reactionOrigin.message.id}_${emojiId}`,
        REACTIONS_LIMIT,
        'reaction',
        3600
      )
    ) {
      return;
    }

    try {
      const contract = await connectToServerContract(warp, wallet, reactionOrigin.message.guildId);
      try {
        const result = (await getStateFromDre(contract.txId(), 'users', user.id)).result;
        if (!result) {
          return;
        }
      } catch (e) {
        return;
      }
      const guild = user.client.guilds.cache.get(reactionOrigin.message.guildId);
      const member = guild?.members.cache.get(user.id);
      const roles = member?.roles.cache.map((r: any) => r.name);

      await contract.writeInteraction(
        {
          function: 'addReaction',
          userId: user.id,
          roles,
          messageId: reactionOrigin.message.id,
          emojiId,
        },
        {
          tags: [new Tag('Indexed-By', `reaction-add;${user.id};${reactionOrigin.message.guildId};`)],
        }
      );
      // return { ...userToReactions, [id]: (userToReactions[id] || 0) + 1 };
    } catch (e: any) {
      console.log(e);
      console.error(`Unable to write interaction.`);
    }
  },
};

export const limitTransactionsPerTimeLag = (
  transactions: TransactionsPerTimeLag,
  userId: string,
  transactionTimestamp: number,
  transactionId: string,
  transactionsLimit: number,
  typeOfTransaction: 'message' | 'reaction' | 'roulette',
  timeLag: number
) => {
  const now = Date.now();
  const lastFullTimestamp = now - (now % (timeLag * 1000));
  const userTransactions = transactions[userId];
  if (userTransactions) {
    const userTransactionsLimited = userTransactions.filter((m) => m.timestamp >= lastFullTimestamp);
    transactions[userId] = [...userTransactionsLimited];
    if (userTransactionsLimited.length < transactionsLimit) {
      transactions[userId].push({ timestamp: transactionTimestamp, txId: transactionId });
      return true;
    } else {
      console.warn(
        `Skipping ${typeOfTransaction} sending. Trasaction author: ${userId}, transaction id: ${transactionId}.`
      );
      return false;
    }
  } else {
    console.info(`Adding user to ${typeOfTransaction} transactionsPerTimeLag: ${userId}.`);
    transactions[userId] = [{ timestamp: transactionTimestamp, txId: transactionId }];
    return true;
  }
};
