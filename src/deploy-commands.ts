import * as dotenv from 'dotenv';
import { REST, Routes } from 'discord.js';
// const { REST, Routes } = require('discord.js');
// const { clientId, guildId, token } = require('./config.json');
import fs from 'fs';
import path from 'path';

dotenv.config();

// and deploy your commands!
(async () => {
  const commands = [];
  // Grab all the command files from the commands directory you created earlier
  const commandsPath = path.join(__dirname, 'commands');
  const commandFiles = fs.readdirSync(commandsPath).filter((file) => file.endsWith('.ts'));

  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = await import(filePath);
    if ('data' in command.default && 'execute' in command.default) {
      commands.push(command.default.data.toJSON());
    } else {
      console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
    }
  }

  // Construct and prepare an instance of the REST module
  const rest = new REST().setToken(process.env.DISCORD_TOKEN as string);
  try {
    console.log(`Started refreshing ${commands.length} application (/) commands.`);

    // The put method is used to fully refresh all commands in the guild with the current set
    const data = await rest.put(
      Routes.applicationGuildCommands(process.env.CLIENT_ID as string, process.env.SERVER_ID as string),
      {
        body: commands,
      }
    );

    console.log(`Successfully reloaded ${(data as any).length} application (/) commands.`);
  } catch (error) {
    // And of course, make sure you catch and log any errors!
    console.error(error);
  }
})();
