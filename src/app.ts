import * as dotenv from 'dotenv';
import { Client, Collection, Events, IntentsBitField, Partials } from 'discord.js';
import { connectToServersContract, initializeWarp, readWallet } from './utils';
// import { onGuildCreate } from './events/guildCreate';
// import { onMessageCreate } from './events/messageCreate';
// import { onMessageReactionAdd } from './events/messageReactionAdd';
import { LoggerFactory } from 'warp-contracts';
import path from 'path';
import fs from 'fs';
// import { Contract } from 'ethers';

dotenv.config();

async function main() {
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

  // let userToMessages: { [serverIduserId: string]: number } = {};
  // let userToReactions: { [serverIduserId: string]: number } = {};

  // setInterval(() => {
  //   userToMessages = {};
  //   userToReactions = {};
  // }, 1000 * 60 * 60 * 24);

  client.commands = new Collection();

  const commandsPath = path.join(__dirname, 'commands');
  const commandFiles = fs.readdirSync(commandsPath).filter((file) => file.endsWith('.js'));
  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = await import(filePath);
    if ('data' in command.default && 'execute' in command.default) {
      client.commands.set(command.default.data.name, command);
    } else {
      console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
    }
  }

  client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    const command = interaction.client.commands.get(interaction.commandName);

    if (!command) {
      console.error(`No command matching ${interaction.commandName} was found.`);
      return;
    }

    try {
      await command.default.execute(interaction, warp, wallet);
    } catch (error) {
      console.error(error);
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
      } else {
        await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
      }
    }
  });

  const eventsPath = path.join(__dirname, 'events');
  const eventFiles = fs.readdirSync(eventsPath).filter((file) => file.endsWith('.js'));
  for (const file of eventFiles) {
    const filePath = path.join(eventsPath, file);
    const event = await import(filePath);
    if (event.default.once) {
      client.once(event.default.name, (...args) => event.default.execute(...args));
    } else {
      if (event.default.name == 'messageCreate' || event.default.name == 'messageDelete') {
        client.on(event.default.name, async (...args) => await event.default.execute(...args, warp, wallet));
      } else if (event.default.name == 'messageReactionAdd') {
        client.on(event.default.name, async (...args) => await event.default.execute(...args, warp, wallet));
      } else if (event.default.name == 'guildCreate') {
        client.on(
          event.default.name,
          async (...args) => await event.default.execute(...args, warp, wallet, serversContract)
        );
      }
    }
  }

  // const wallet = readWallet();
  // LoggerFactory.INST.logLevel('error');
  // const warp = initializeWarp();
  // const serversContract = connectToServersContract(warp, wallet);

  // client.once(Events.ClientReady, () => {
  //   console.log('Warpik is online!');
  // });

  // client.on('guildCreate', async (guild) => {
  //   await onGuildCreate(guild, warp, wallet, serversContract);
  // });

  // client.on('messageCreate', async (message) => {
  //   const result = await onMessageCreate(message, warp, wallet, userToMessages);
  //   if (result) {
  //     userToMessages = result;
  //   }
  // });

  // client.on('messageReactionAdd', async (reactionOrigin, user) => {
  //   const result = await onMessageReactionAdd(reactionOrigin, user, warp, wallet, userToReactions);
  //   if (result) {
  //     userToReactions = result;
  //   }
  // });

  client.login(process.env.DISCORD_TOKEN);
}

main().catch((e) => console.log(e));

process.on('unhandledRejection', (error) => {
  console.error('Unhandled promise rejection:', error);
});

process.on('uncaughtException', (error) => {
  console.error(`Uncaught exception:`, error);
});
