import * as dotenv from 'dotenv';
import express from 'express';
import { RequestWithContext } from './types/express';
import { Client, IntentsBitField, Partials } from 'discord.js';
import routes from './router/listener';
import cors from 'cors';

dotenv.config();

const app = express();
app.use(cors());
const port = process.env.PORT_LISTENER || 8081;

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
  const ctx = {
    client,
    serverId: process.env.SERVER_ID,
  };
  app.use((req: RequestWithContext, res, next) => {
    req.ctx = ctx;
    next();
  });
  app.use('/', routes);

  app.listen(port, () => {
    console.log(`Warpy Api listening on port ${port}`);
  });
}

main().catch((e) => console.error(e));
