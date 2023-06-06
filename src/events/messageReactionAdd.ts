import { MessageReaction, PartialMessageReaction, PartialUser, User } from 'discord.js';
import { Contract, JWKInterface, Tag, Warp } from 'warp-contracts';
import { connectToServerContract, DAILY_REACTIONS_LIMIT } from '../utils';

export async function onMessageReactionAdd(
  reactionOrigin: MessageReaction | PartialMessageReaction,
  user: User | PartialUser,
  warp: Warp,
  wallet: JWKInterface,
  serversContract: Contract,
  userToReactions: { [user: string]: number }
) {
  const id = `${reactionOrigin.message.guildId}_${user.id}`;
  if (user.bot) return;
  if (userToReactions[id] > DAILY_REACTIONS_LIMIT) return;

  try {
    const contract = await connectToServerContract(warp, serversContract, wallet, reactionOrigin.message.guildId);
    await contract.writeInteraction(
      { function: 'addReaction', id: user.id },
      {
        tags: [new Tag('Indexed-By', `reaction-add;${user.id};${reactionOrigin.message.guildId};`)],
      }
    );
    return { ...userToReactions, [id]: (userToReactions[id] || 0) + 1 };
  } catch (e: any) {
    console.error(`Unable to write interaction.`);
  }
}
