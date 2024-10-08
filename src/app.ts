import * as dotenv from 'dotenv';
import { Client, Collection, Events, IntentsBitField, Partials } from 'discord.js';
import { connectToServersContract, initializeWarp, readWallet } from './utils';
import { LoggerFactory } from 'warp-contracts';
import path from 'path';
import fs from 'fs';
import express from 'express';
import routes from './router/app';
import { RequestWithContext } from './types/express';
import { TransactionsPerTimeLag } from './types/discord';

dotenv.config();

const app = express();
const port = process.env.PORT || 8080;

const messages: TransactionsPerTimeLag = {};
const reactions: TransactionsPerTimeLag = {};

async function main() {
  const client = new Client({
    intents: [
      IntentsBitField.Flags.Guilds,
      IntentsBitField.Flags.GuildMembers,
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
      if (event.default.name == 'messageReactionAdd') {
        client.on(event.default.name, async (...args) => await event.default.execute(...args, warp, wallet, reactions));
      } else if (event.default.name == 'messageReactionRemove') {
        client.on(event.default.name, async (...args) => await event.default.execute(...args, warp, wallet, reactions));
      } else if (event.default.name == 'guildMemberUpdate') {
        client.on(event.default.name, async (...args) => await event.default.execute(...args, warp, wallet));
      } else if (event.default.name == 'guildCreate') {
        client.on(
          event.default.name,
          async (...args) => await event.default.execute(...args, warp, wallet, serversContract)
        );
      }
    }
  }

  client.login(process.env.DISCORD_TOKEN);

  const ctx = {
    client,
  };
  app.use((req: RequestWithContext, res, next) => {
    req.ctx = ctx;
    next();
  });
  app.use('/', routes);

  app.listen(port, () => {
    console.log(`Warpy Discord Bot app listening on port ${port}`);
  });
}

main().catch((e) => console.log(e));

process.on('unhandledRejection', (error) => {
  console.error('Unhandled promise rejection:', error);
});

process.on('uncaughtException', (error) => {
  console.error(`Uncaught exception:`, error);
});
