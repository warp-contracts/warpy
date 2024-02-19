import * as dotenv from 'dotenv';
import express from 'express';
import { Client, IntentsBitField, Message, Partials, TextChannel } from 'discord.js';
import cors from 'cors';
import { backOff } from 'exponential-backoff';
import fs from 'fs';
import path from 'path';
import { WarpFactory, WriteInteractionResponse } from 'warp-contracts';

dotenv.config();

const app = express();
app.use(cors());
const port = process.env.PORT_LISTENER || 8081;

const wallet = JSON.parse(fs.readFileSync(path.resolve('./.secrets', 'wallet.json'), 'utf-8'));
const warp = WarpFactory.forMainnet().useGwUrl('https://gw.warp.cc');
const contract = warp.contract('p5OI99-BaY4QbZts266T7EDwofZqs-wVuYJmMCS0SUU').connect(wallet).setEvaluationOptions({
  sequencerUrl: 'https://gw.warp.cc/',
});

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
  const messages: Message[] = [];
  const channel = (await client.channels.fetch('1207259581915598848')) as TextChannel;
  let message = await channel.messages
    .fetch({ limit: 1 })
    .then((messagePage) => (messagePage.size === 1 ? messagePage.at(0) : null));

  while (message) {
    await channel.messages.fetch({ limit: 100, before: message.id }).then((messagePage) => {
      messagePage.forEach((msg) => messages.push(msg));

      message = messagePage.at(-1);
    });
  }

  fs.writeFileSync('messages.json', JSON.stringify(Object.fromEntries(messages.map((m) => [m.id, m.author.id]))));

  const file = JSON.parse(fs.readFileSync('messages.json', 'utf-8'));
  const fileValues = Object.values(file).filter(onlyUnique);
  fs.writeFileSync('uniqueMessages.json', JSON.stringify(fileValues));
  let users: { [id: string]: string };
  try {
    users = (
      await fetch(
        `https://dre-warpy.warp.cc/contract?id=p5OI99-BaY4QbZts266T7EDwofZqs-wVuYJmMCS0SUU&query=$.users`
      ).then((res) => {
        return res.json();
      })
    ).result[0];
  } catch (e) {
    throw new Error(`Could not load state from DRE node.`);
  }

  const usersNotFound: { [key: string]: string } = {};
  const chunkSize = 150;
  for (let i = 0; i < fileValues.length; i += chunkSize) {
    const chunk = fileValues.slice(i, i + chunkSize);
    let members;
    try {
      members = await Promise.all(
        chunk.map(async (c, j) => {
          let roles;

          const userId = fileValues[i + j] as string;
          if (users[userId]) {
            const request = async () => {
              return fetch(`https://api-warpy.warp.cc/v1/userRoles?id=${userId}`).then((res) => {
                return res.ok ? res.json() : Promise.reject(res);
              });
            };
            try {
              roles = await fetch(`https://api-warpy.warp.cc/v1/userRoles?id=${userId}`).then((res) => {
                return res.ok ? res.json() : Promise.reject(res);
              });
              roles = (await backOff(request, {
                delayFirstAttempt: false,
                maxDelay: 1000,
                numOfAttempts: 5,
              })) as any;
              return {
                id: userId,
                roles,
              };
            } catch (e: any) {
              console.log(`Error while fetching user (id: ${userId}) roles. ${JSON.stringify(e.message)}`);
              return {
                id: userId,
                roles: [],
              };
            }
          } else {
            console.log(`User not found. User id: ${userId}`);
            const key = Object.keys(file).find((k) => file[k] == userId);
            if (key) {
              usersNotFound[key] = userId;
            }
            return;
          }
        })
      );
    } catch (e) {
      console.error(`Chunk has not been successfully processed. Chunk: ${JSON.stringify(chunk)}, error: ${e}.`);
      continue;
    }
    const addPointsInput = {
      function: 'addPoints',
      points: 5000,
      adminId: '769844280767807520',
      members: members.filter((m: any) => m != undefined),
      noBoost: true,
    };
    try {
      const { originalTxId } = (await contract.writeInteraction(addPointsInput)) as WriteInteractionResponse;
      console.log(`Interaction: ${originalTxId} succeeded.`);
    } catch (e) {
      console.error(`Error while executing interaction: ${JSON.stringify(addPointsInput)}`, e);
      break;
    }
  }
  fs.writeFileSync('usersNotFound.json', JSON.stringify(usersNotFound));
  process.exit(0);
}

main().catch((e) => console.error(e));

function onlyUnique(value: any, index: any, array: any) {
  return array.indexOf(value) === index;
}
