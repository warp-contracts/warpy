import { User } from 'discord.js';
import { JWKInterface, Tag, Warp } from 'warp-contracts';
import { connectToServerContract, getStateFromDre } from '../utils';

export default {
  name: 'messageReactionRemove',
  async execute(reactionOrigin: any, user: User, warp: Warp, wallet: JWKInterface) {
    // const id = `${reactionOrigin.message.guildId}_${user.id}`;
    if (user.bot) return;
    // if (userToReactions[id] > DAILY_REACTIONS_LIMIT) return;
    try {
      const contract = await connectToServerContract(warp, wallet, reactionOrigin.message.guildId);
      try {
        const result = (await getStateFromDre(contract.txId(), 'users', user.id)).result[0];
        if (result.length == 0) {
          return;
        }
      } catch (e) {
        return;
      }
      const emojiId = reactionOrigin.emoji.name.replace(/\p{Emoji}/gu, (m: any) => m.codePointAt(0).toString(16));
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
