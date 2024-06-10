import fs from 'fs';
import path from 'path';
import csvParser from 'csv-parser';
import { WarpFactory, WriteInteractionResponse } from 'warp-contracts';
import { getAddress } from 'ethers';
import { backOff } from 'exponential-backoff';
import { Client, IntentsBitField, Partials } from 'discord.js';

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

  const contractId = 'p5OI99-BaY4QbZts266T7EDwofZqs-wVuYJmMCS0SUU';

  const wallet = JSON.parse(fs.readFileSync(path.resolve('./.secrets', 'wallet.json'), 'utf-8'));
  const idList: string[] = [];
  const rolesList: { id: string; roles: string[] }[] = [];
  const chunkSize = Number(process.argv.slice(3)[0]) || 150;
  const warp = WarpFactory.forMainnet().useGwUrl('https://gw.warp.cc');
  const contract = warp.contract(contractId).connect(wallet).setEvaluationOptions({
    sequencerUrl: 'https://gw.warp.cc/',
  });

  let users: any;
  try {
    users = (
      await fetch(
        `https://dre-warpy.warp.cc/pg/contract?id=p5OI99-BaY4QbZts266T7EDwofZqs-wVuYJmMCS0SUU&query=$.users."22933568778413944922"`
      ).then((res) => {
        return res.json();
      })
    ).result;
  } catch (e) {
    throw new Error(`Could not load state from DRE node.`);
  }

  console.log(users);

  //   fs.createReadStream(path.resolve('./roles.csv'), { encoding: 'utf-8' })
  //     .pipe(csvParser())
  //     .on('data', async (chunk) => {
  //       idList.push(chunk.test.substring(0, chunk.test.indexOf('.')));
  //     })
  //     .on('error', (e) => {
  //       throw new Error(`Error while reading CSV stream. ${e}`);
  //     })
  //     .on('end', async () => {
  //       await Promise.all(
  //         idList.map(async (id) => {
  //           try {
  //             console.log(id);
  //             if (users[id]) {
  //               await guild.members.fetch(id).then((mem) => {
  //                 const roles = mem.roles.cache.map((r) => r.name);
  //                 if (roles.includes('Ore Digger') || roles.includes('Rock Breaker')) {
  //                   rolesList.push({ id, roles });
  //                   console.log(rolesList.length);
  //                 }
  //               });
  //             }
  //           } catch (e) {}
  //         })
  //       );

  //       console.log(rolesList.length);
  //     });
}

main().catch((e) => console.error(e));
