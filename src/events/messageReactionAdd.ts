import { User } from 'discord.js';
import { JWKInterface, Tag, Warp } from 'warp-contracts';
import { connectToServerContract, getStateFromDre } from '../utils';
import { limitTransactionsPerTimeLag } from './messageCreate';
import { TransactionsPerTimeLag } from '../types/discord';

const REACTIONS_TIMESTAMP_LIMIT = 3600000;
const REACTIONS_LIMIT = 10;

export default {
  name: 'messageReactionAdd',
  async execute(
    reactionOrigin: any,
    user: User,
    warp: Warp,
    wallet: JWKInterface,
    reactionsPerTimeLag: TransactionsPerTimeLag
  ) {
    if (user.bot) return;

    const emojiId = reactionOrigin.emoji.name.replace(/\p{Emoji}/gu, (m: any) => m.codePointAt(0).toString(16));

    limitTransactionsPerTimeLag(
      REACTIONS_TIMESTAMP_LIMIT,
      reactionsPerTimeLag,
      user.id,
      Date.now(),
      `${reactionOrigin.message.id}_${emojiId}`,
      REACTIONS_LIMIT,
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
      console.error(`Unable to write interaction.`);
    }
  },
};
