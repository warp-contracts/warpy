import * as dotenv from 'dotenv';
import { Client, IntentsBitField, Partials } from 'discord.js';
import { connectToServerContract, isTxIdValid } from './utils';
import { LoggerFactory, WarpFactory } from 'warp-contracts';
import { ArweaveSigner, DeployPlugin } from 'warp-contracts-plugin-deploy';
import fs from 'fs';
import path from 'path';

dotenv.config();

const client = new Client({
  intents: [
    IntentsBitField.Flags.Guilds,
    IntentsBitField.Flags.GuildMessages,
    IntentsBitField.Flags.MessageContent,
    IntentsBitField.Flags.GuildMessageReactions,
  ],
  partials: [Partials.Message, Partials.Reaction],
});

const warp = WarpFactory.forMainnet().use(new DeployPlugin());

LoggerFactory.INST.logLevel('error');
const BOT_CONTRACT_SRC = 'dJHzc0gF1ddzpo3_IzQMZnjDnktbz5ZfiZgO6aoK5Ss';
const SERVERS_CONTRACT = 'RzrUiGymvRZEA3Bd4zxL8l4SRvsdllvtiaZUsnyWNsw';
const wallet = JSON.parse(fs.readFileSync(path.resolve('.secrets', 'wallet.json'), 'utf-8'));
const serversContract = warp.contract(SERVERS_CONTRACT).connect(wallet).setEvaluationOptions({ useKVStorage: true });

client.on('ready', () => {
  console.log('Warpik is online!');
});

client.on('guildCreate', async (guild) => {
  const { contractTxId } = await warp.deployFromSourceTx({
    wallet: new ArweaveSigner(wallet),
    srcTxId: BOT_CONTRACT_SRC,
    initState: JSON.stringify({
      owner: warp.arweave.wallets.jwkToAddress(wallet),
      serverName: guild.name,
      creationTimestamp: Date.now(),
      ticker: `${guild.name.toUpperCase().replace(/ /g, '_')}_TICKER`,
      name: `${guild.name} PST`,
      messagesTokenWeight: 100,
      reactionsTokenWeight: 10,
      balances: {},
      messages: {},
      users: {},
      counter: {},
    }),
    evaluationManifest: {
      evaluationOptions: {
        useKVStorage: true,
      },
    },
  });

  console.log(contractTxId);
  await serversContract.writeInteraction({
    function: 'registerServer',
    serverId: guild.id,
    serverName: guild.name,
    contractTxId,
  });
});

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  const contract = await connectToServerContract(warp, serversContract, wallet, message.guild!.id);

  if (message.content.startsWith('warpik link wallet')) {
    message.channel.sendTyping();
    const args = message.content.trim().split(/ +/g);
    if (!args[3]) {
      message.reply('Please specify wallet address.');
      message.react('👎');
      return;
    }
    if (args[4]) {
      message.reply('Too many arguments. Please specify only wallet address.');
      message.react('👎');
      return;
    }

    const wallet = args[3];
    if (!isTxIdValid(wallet)) {
      message.reply('Wallet address is not valid.');
      message.react('👎');
      return;
    }

    const address = (
      await contract.viewState<{ function: string; id: string }, { address: string }>({
        function: 'getAddress',
        id: message.author.id,
      })
    ).result?.address;

    if (address) {
      message.reply('User already registered.');
      message.react('👎');
      return;
    }

    await contract.writeInteraction({
      function: 'registerUser',
      id: message.author.id,
      address: wallet,
    });

    message.reply('User registered correctly.');
    message.react('🍭');
  } else if (message.content.startsWith('warpik mint')) {
    message.channel.sendTyping();
    const address = (
      await contract.viewState<{ function: string; id: string }, { address: string }>({
        function: 'getAddress',
        id: message.author.id,
      })
    ).result?.address;

    if (!address) {
      message.reply('User not registered in the name service. Please ping warpik with `warpik link wallet` first.');
      message.react('👎');
      return;
    }

    await contract.writeInteraction({ function: 'mint', id: message.author.id });
    const balance = (
      await contract.viewState<
        { function: string; target: string },
        { target: string; ticker: string; balance: number }
      >({ function: 'balance', target: address })
    ).result?.balance;
    message.reply(`Tokens minted correctly. You have now ${balance} tokens.`);
    message.react('🍭');
  } else if (message.content.startsWith(`warpik balance`)) {
    message.channel.sendTyping();
    const address = (
      await contract.viewState<{ function: string; id: string }, { address: string }>({
        function: 'getAddress',
        id: message.author.id,
      })
    ).result?.address;

    if (!address) {
      message.reply('User not registered in the name service. Please ping warpik with `warpik link wallet` first.');
      message.react('👎');
      return;
    }

    const balance = (
      await contract.viewState<
        { function: string; target: string },
        { target: string; ticker: string; balance: number }
      >({ function: 'balance', target: address })
    ).result?.balance;
    message.reply(`You have ${balance} tokens.`);
    message.react('🍭');
  } else if (message.content.startsWith('warpik counter')) {
    message.channel.sendTyping();
    const result = (
      await contract.viewState<{ function: string; id: string }, { counter: { messages: number; reactions: number } }>({
        function: 'getCounter',
        id: message.author.id,
      })
    ).result.counter;
    message.reply(`You have sent ${result.messages} messages and ${result.reactions} reactions.`);
    message.react('🍭');
  } else {
    await contract.writeInteraction({
      function: 'addMessage',
      id: message.author.id,
      content: message.content,
      messageId: message.id,
    });
  }
});

client.on('messageReactionAdd', async (reactionOrigin, user) => {
  if (user.bot) return;
  const contract = await connectToServerContract(warp, serversContract, wallet, reactionOrigin.message.guildId);
  await contract.writeInteraction({ function: 'addReaction', id: user.id });
});

client.on('messageDelete', async (message) => {
  if (message.author?.bot) return;
  const contract = await connectToServerContract(warp, serversContract, wallet, message.guildId);
  await contract.writeInteraction({ function: 'removeMessage', id: message.author?.id, messageId: message.id });
});

client.on('messageReactionRemove', async (reactionOrigin, user) => {
  if (user.bot) return;
  const contract = await connectToServerContract(warp, serversContract, wallet, reactionOrigin.message.guildId);
  await contract.writeInteraction({ function: 'removeReaction', id: user.id });
});

client.login(process.env.DISCORD_TOKEN);
