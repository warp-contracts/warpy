import * as dotenv from 'dotenv';
import express from 'express';
import { Client, IntentsBitField, Partials } from 'discord.js';
import cors from 'cors';

dotenv.config();

const app = express();
app.use(cors());

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
  await client.login(process.env.DISCORD_TOKEN);
  console.log('logged');
  const guild = await client.guilds.fetch('786251205008949258');
  for (let i = 0; i < 10; i++) {
    console.time();
    await guild.members.fetch({ user: '769844280767807520', force: true }).then((mem) => {
      const roles = mem.roles.cache.map((r) => r.name);
      console.log(roles);
    });
    console.timeEnd();
  }
  process.exit(0);
}

main().catch((e) => console.error(e));
