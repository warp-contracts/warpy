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
  const members = guild.roles.cache.get('1230530157219942583')?.members;
  console.dir(members, { depth: null });

  if (members) {
    const membersInWarpy = members
      // .filter((m: any) => Object.prototype.hasOwnProperty.call(response.users, m.id))
      .map((member: any) => ({
        id: member.user.id,
        roles: member.roles.cache.map((r: any) => r.name),
      }));
    console.dir(membersInWarpy, { depth: null });
  }
  //   await guild.members.fetch({ user: '769844280767807520', force: true }).then((mem) => {
  //     const roles = mem.roles.cache.map((r) => r.name);
  //     console.log(roles);
  //   });
  process.exit(0);
}

main().catch((e) => console.error(e));
