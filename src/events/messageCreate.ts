import { Message } from 'discord.js';
import { Contract, JWKInterface, Tag, Warp } from 'warp-contracts';
import { connectToServerContract, DAILY_MESSAGES_LIMIT, getStateFromDre, isTxIdValid } from '../utils';

export async function onMessageCreate(
  message: Message<boolean>,
  warp: Warp,
  serversContract: Contract,
  wallet: JWKInterface,
  userToMessages: { [userId: string]: number }
): Promise<{ [userId: string]: number } | null> {
  const id = `${message.guildId}_${message.author.id}`;
  if (message.author.bot) return null;
  if (userToMessages[id] > DAILY_MESSAGES_LIMIT) return null;

  const contract = await connectToServerContract(warp, serversContract, wallet, message.guildId);

  if (message.content.startsWith('warpik link wallet')) {
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
    if (!isTxIdValid(wallet)) {
      message.reply('Wallet address is not valid.');
      message.react('👎');
      return null;
    }

    let address: string | [];
    try {
      address = await getStateFromDre(contract.txId(), 'users', message.author.id);
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

    message.reply('User registered correctly.');
    message.react('🍭');
    return null;
  } else if (message.content.startsWith('warpik mint')) {
    message.channel.sendTyping();

    let address: string | [];
    try {
      address = await getStateFromDre(contract.txId(), 'users', message.author.id);
    } catch (e) {
      message.reply(`Could not load state from D.R.E. nodes.`);
      return null;
    }

    if (address.length == 0) {
      message.reply('User not registered in the name service. Please ping warpik with `warpik link wallet` first.');
      message.react('👎');
      return null;
    }

    await contract.writeInteraction(
      { function: 'mint', id: message.author.id },
      {
        tags: [new Tag('Indexed-By', `mint;${message.author.id};${message.guildId};`)],
      }
    );

    let balance: string;
    try {
      balance = await getStateFromDre(contract.txId(), 'balances', address as string);
    } catch (e) {
      message.reply(`Could not load state from D.R.E. nodes.`);
      return null;
    }

    message.reply(`Tokens minted correctly. You have now ${balance} tokens.`);
    message.react('🍭');
    return null;
  } else if (message.content.startsWith(`warpik balance`)) {
    message.channel.sendTyping();

    let address: string | [];
    try {
      address = await getStateFromDre(contract.txId(), 'users', message.author.id);
    } catch (e) {
      message.reply(`Could not load state from D.R.E. nodes.`);
      return null;
    }

    if (address.length == 0) {
      message.reply('User not registered in the name service. Please ping warpik with `warpik link wallet` first.');
      message.react('👎');
      return null;
    }

    let balance: string;
    try {
      balance = await getStateFromDre(contract.txId(), 'balances', address as string);
    } catch (e) {
      message.reply(`Could not load state from D.R.E. nodes.`);
      return null;
    }

    message.reply(`You have ${balance.length > 0 ? balance : 0} tokens.`);
    message.react('🍭');
    return null;
  } else if (message.content.startsWith('warpik counter')) {
    message.channel.sendTyping();

    let result: { messages: number; reactions: number }[];
    try {
      result = await getStateFromDre(contract.txId(), 'counter', message.author.id);
    } catch (e) {
      message.reply(`Could not load state from D.R.E. nodes.`);
      return null;
    }

    message.reply(`You have sent ${result[0].messages} messages and ${result[0].reactions} reactions.`);
    message.react('🍭');
    return null;
  } else if (message.content.startsWith(`warpik help`)) {
    message.reply(`Hey, my name is Warpik. Here is the list of commands you can use to interact with me:
    \n👛 **warpik mint** - use it if you want to mint tokens for the messages and reactions you've sent before linking your wallet
    \n💰 **warpik balance** - check your tokens balance
    \n💼 **warpik link wallet <wallet_id>** - link you wallet address to start receiving tokens for your activity
    \n📊 **warpik counter** - check number of the messages and reactions you've sent so far`);
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
