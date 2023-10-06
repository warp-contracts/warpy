import { User } from 'discord.js';
import { JWKInterface, Tag, Warp } from 'warp-contracts';
import { connectToServerContract, getStateFromDre } from '../utils';

export default {
  name: 'messageReactionAdd',
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
      await contract.writeInteraction(
        {
          function: 'addReaction',
          userId: user.id,
          roles: reactionOrigin.message.member?.roles.cache.map((r: any) => r.name),
          messageId: reactionOrigin.message.id,
          emojiId: reactionOrigin.emoji.id,
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
