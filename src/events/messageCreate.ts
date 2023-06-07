import { Message } from 'discord.js';
import { JWKInterface, Tag, Warp } from 'warp-contracts';
import {
  connectToServerContract,
  DAILY_MESSAGES_LIMIT,
  getServerContractId,
  getStateFromDre,
  isEthWallet,
  isTxIdValid,
} from '../utils';

export async function onMessageCreate(
  message: Message<boolean>,
  warp: Warp,
  wallet: JWKInterface,
  userToMessages: { [userId: string]: number }
): Promise<{ [userId: string]: number } | null> {
  const id = `${message.guildId}_${message.author.id}`;
  if (message.author.bot) return null;
  if (userToMessages[id] > DAILY_MESSAGES_LIMIT) return null;

  const contract = await connectToServerContract(warp, wallet, message.guildId);

  if (message.content.startsWith('/warpik link wallet')) {
    message.channel.sendTyping();
    const args = message.content.trim().split(/ +/g);
    if (!args[3]) {
      message.reply('Please specify wallet address.');
      message.react('👎');
      return null;
    }
    if (args[4]) {
      message.reply('Too many arguments. Please specify only wallet address.');
      message.react('👎');
      return null;
    }

    const wallet = args[3];
    if (!isTxIdValid(wallet) && !isEthWallet(wallet)) {
      message.reply('Wallet address is not valid.');
      message.react('👎');
      return null;
    }

    let address: string | [];
    try {
      address = (await getStateFromDre(contract.txId(), 'users', message.author.id)).result;
    } catch (e) {
      message.reply(`Could not load state from D.R.E. nodes.`);
      return null;
    }

    if (address.length > 0) {
      message.reply('User already registered.');
      message.react('👎');
      return null;
    }

    await contract.writeInteraction({
      function: 'registerUser',
      id: message.author.id,
      address: wallet,
    });

    let result: { messages: number; reactions: number }[];
    let balance = 0;

    try {
      result = (await getStateFromDre(contract.txId(), 'counter', message.author.id)).result;
    } catch (e) {
      message.reply(`Could not load state from D.R.E. nodes.`);
      return null;
    }

    if (result.length > 0) {
      await contract.writeInteraction(
        { function: 'mint', id: message.author.id },
        {
          tags: [new Tag('Indexed-By', `mint;${message.author.id};${message.guildId};`)],
        }
      );

      try {
        balance = (await getStateFromDre(contract.txId(), 'balances', address as string)).result[0];
      } catch (e) {
        message.reply(`Could not load state from D.R.E. nodes.`);
        return null;
      }
    }

    message.reply(`User registered correctly. You have ${balance} tokens.`);
    message.react('🍭');
    return null;
  } else if (message.content.startsWith(`/warpik contract`)) {
    const contractTxId = await getServerContractId(message.guildId);
    message.reply(`Here is the server contract: https://sonar.warp.cc/#/app/contract/${contractTxId}`);
    message.react('🍭');
    return null;
  } else if (message.content.startsWith(`/warpik balance`)) {
    message.channel.sendTyping();

    let address: string | [];
    try {
      address = (await getStateFromDre(contract.txId(), 'users', message.author.id)).result;
    } catch (e) {
      message.reply(`Could not load state from D.R.E. nodes.`);
      return null;
    }

    if (address.length == 0) {
      message.reply(
        'User not registered in the name service. Please ping warpik with `warpik link wallet <wallet_id>` first.'
      );
      message.react('👎');
      return null;
    }

    let balance: string;
    try {
      balance = (await getStateFromDre(contract.txId(), 'balances', address as string)).result;
    } catch (e) {
      message.reply(`Could not load state from D.R.E. nodes.`);
      return null;
    }

    message.reply(`You have ${balance.length > 0 ? balance : 0} tokens.`);
    message.react('🍭');
    return null;
  } else if (message.content.startsWith('/warpik counter')) {
    message.channel.sendTyping();

    let result: { messages: number; reactions: number }[];
    try {
      result = (await getStateFromDre(contract.txId(), 'counter', message.author.id)).result;
    } catch (e) {
      message.reply(`Could not load state from D.R.E. nodes.`);
      return null;
    }

    message.reply(`You have sent ${result[0].messages || 0} messages and ${result[0].reactions || 0} reactions.`);
    message.react('🍭');
    return null;
  } else if (message.content.startsWith(`/warpik ranking`)) {
    message.channel.sendTyping();
    let balances;

    try {
      balances = (await getStateFromDre(contract.txId())).state.balances;
      const balancesArray: [string, number][] = Object.entries(balances);
      const balancesSorted = balancesArray.sort((a, b) => b[1] - a[1]).slice(0 - 9);

      const rankingArray: any = await Promise.all(
        balancesSorted.map(async (b) => {
          try {
            const result = await getStateFromDre(contract.txId());
            const userId = Object.keys(result.state.users).find((key) => result.state.users[key] === b[0]);
            return { id: userId, tokens: b[1] };
          } catch (e) {
            message.reply(`Could not load state from D.R.E. nodes.`);
            return null;
          }
        })
      );
      let text = ``;
      for (let i = 0; i < rankingArray.length; i++) {
        text += `${i + 1}. <@${rankingArray[i].id}> - ${rankingArray[i].tokens} tokens\n`;
      }
      message.reply(text);
      message.react('🍭');
    } catch (e) {
      message.reply(`Could not load state from D.R.E. nodes.`);
      return null;
    }
    return null;
  } else if (message.content.startsWith(`/warpik help`)) {
    message.channel.sendTyping();
    message.reply(`Hey, my name is Warpik. Here is the list of commands you can use to interact with me:
    \n💼 **/warpik link wallet <wallet_id>** - link you wallet address to start receiving tokens for your activity
    \n💰 **/warpik balance** - check your tokens balance
    \n📊 **/warpik counter** - check number of the messages and reactions you've sent so far
    \n📃 **/warpik contract** - get link to this server's warpik contract`);
    return null;
  } else if (!message.content) {
    return null;
  } else {
    await contract.writeInteraction(
      {
        function: 'addMessage',
        id: message.author.id,
        content: message.content,
        messageId: message.id,
      },
      {
        tags: [new Tag('Indexed-By', `message-add;${message.author.id};${message.guildId};`)],
      }
    );
    return {
      ...userToMessages,
      [id]: (userToMessages[id] || 0) + 1,
    };
  }
}
