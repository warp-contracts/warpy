import * as dotenv from 'dotenv';
import { Client, IntentsBitField, Partials } from 'discord.js';
import { connectToServersContract, initializeWarp, readWallet } from './utils';
import { onGuildCreate } from './events/guildCreate';
import { onMessageCreate } from './events/messageCreate';
import { onMessageReactionAdd } from './events/messageReactionAdd';
import { LoggerFactory } from 'warp-contracts';

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

const wallet = readWallet();
LoggerFactory.INST.logLevel('error');
const warp = initializeWarp();
const serversContract = connectToServersContract(warp, wallet);
let userToMessages: { [serverIduserId: string]: number } = {};
let userToReactions: { [serverIduserId: string]: number } = {};

setInterval(() => {
  userToMessages = {};
  userToReactions = {};
}, 1000 * 60 * 60 * 24);

client.on('ready', () => {
  console.log('Warpik is online!');
});

client.on('guildCreate', async (guild) => {
  await onGuildCreate(guild, warp, wallet, serversContract);
});

client.on('messageCreate', async (message) => {
  const result = await onMessageCreate(message, warp, serversContract, wallet, userToMessages);
  if (result) {
    userToMessages = result;
  }
});

client.on('messageReactionAdd', async (reactionOrigin, user) => {
  const result = await onMessageReactionAdd(reactionOrigin, user, warp, wallet, serversContract, userToReactions);
  if (result) {
    userToReactions = result;
  }
});

client.login(process.env.DISCORD_TOKEN);

process.on('unhandledRejection', (error) => {
  console.error('Unhandled promise rejection:', error);
});

process.on('uncaughtException', (error) => {
  console.error(`Uncaught exception:`, error);
});
