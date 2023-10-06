import { Message } from 'discord.js';
import { Tag, Warp } from 'warp-contracts';
import { connectToServerContract, getStateFromDre } from '../utils';

export default {
  name: 'messageDelete',
  async execute(message: Message, warp: Warp, wallet: any) {
    if (message.author.bot) return;
    if (message.content == '') {
      return;
    } else {
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
          id: message.author.id,
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
