import { User } from 'discord.js';
import { JWKInterface, Tag, Warp } from 'warp-contracts';
import { connectToServerContract, getStateFromDre } from '../utils';
import { TransactionsPerTimeLag } from '../types/discord';

export default {
  name: 'messageReactionRemove',
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

    deleteFromLimitedTransactionsIfExists(
      reactionsPerTimeLag,
      user.id,
      `${reactionOrigin.message.id}_${emojiId}`,
      'reaction'
    );

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
      await contract.writeInteraction(
        {
          function: 'removeReaction',
          userId: user.id,
          messageId: reactionOrigin.message.id,
          emojiId,
        },
        {
          tags: [new Tag('Indexed-By', `reaction-delete;${user.id};${reactionOrigin.message.guildId};`)],
        }
      );
      // return { ...userToReactions, [id]: (userToReactions[id] || 0) + 1 };
    } catch (e: any) {
      console.error(`Unable to write interaction.`);
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
