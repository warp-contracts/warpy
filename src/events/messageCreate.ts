import { Message } from 'discord.js';
// import { JWKInterface, Tag, Warp } from 'warp-contracts';
// import {
//   connectToServerContract,
//   DAILY_MESSAGES_LIMIT,
//   getMessageArgs,
//   getServerContractId,
//   getStateFromDre,
// } from '../utils';

// export async function onMessageCreate(
//   message: Message<boolean>,
//   warp: Warp,
//   wallet: JWKInterface,
//   userToMessages: { [userId: string]: number }
// ): Promise<{ [userId: string]: number } | null> {
//   const id = `${message.guildId}_${message.author.id}`;
//   if (message.author.bot) return null;
//   if (userToMessages[id] > DAILY_MESSAGES_LIMIT) return null;

//   const contract = await connectToServerContract(warp, wallet, message.guildId);

//   } else {
//     await contract.writeInteraction(
//       {
//         function: 'addMessage',
//         id: message.author.id,
//         content: message.content,
//         messageId: message.id,
//       },
//       {
//         tags: [new Tag('Indexed-By', `message-add;${message.author.id};${message.guildId};`)],
//       }
//     );
//     return {
//       ...userToMessages,
//       [id]: (userToMessages[id] || 0) + 1,
//     };
//   }
// }

import { Tag, Warp } from 'warp-contracts';
import { connectToServerContract } from '../utils';

export default {
  name: 'messageCreate',
  async execute(message: Message, warp: Warp, wallet: any) {
    console.log('test');
    // const id = `${message.guildId}_${message.author.id}`;
    if (message.author.bot) return;
    // if (userToMessages[id] > DAILY_MESSAGES_LIMIT) return null;

    if (message.content == '') {
      return;
    } else {
      const contract = await connectToServerContract(warp, wallet, message.guildId);
      await contract.writeInteraction(
        {
          function: 'addMessage',
          id: message.author.id,
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
