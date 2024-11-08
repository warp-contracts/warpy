import fs from 'fs';
import * as dotenv from 'dotenv';
import { Client, IntentsBitField, Partials } from 'discord.js';

dotenv.config();

const chunkSize = 10000;
const guildId = '786251205008949258';

async function getGuildInfo() {
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
  return await client.guilds.fetch(guildId);
}

async function getState() {
  console.log(`Starting fetching state.`);
  try {
    const state = (
      await fetch(`https://dre-warpy.warp.cc/contract?id=p5OI99-BaY4QbZts266T7EDwofZqs-wVuYJmMCS0SUU`).then((res) => {
        return res.json();
      })
    ).state;
    fs.writeFileSync('state.json', JSON.stringify(state));
    console.log(`State fetched.`);
    return state;
  } catch (e) {
    console.error(e);
    throw new Error(`Could not load state from DRE node.`);
  }
}

function getBalancesMap(users, balances) {
  const linkedMap = {};
  const invertedUsers = invertUsersMap(users);
  const zombieWallets = {};
  for (const [wallet, balance] of Object.entries(balances)) {
    const userId = invertedUsers[wallet] || invertedUsers[wallet.toLowerCase()];
    if (userId) {
      linkedMap[wallet] = {
        id: userId,
        balance: balance,
      };
    } else {
      zombieWallets[wallet] = balance;
    }
  }

  console.log(`Found: ${Object.keys(zombieWallets).length} zombie wallets.`);
  fs.writeFileSync('zombie_wallets.json', JSON.stringify(zombieWallets));
  return linkedMap;
}

async function processBalances(balances, guild) {
  const ids = Object.values(balances).map(({ id }) => id);
  const chunks = chunkArray(ids, chunkSize);
  let count = 0;
  let idToRoles = {};
  console.log(`Ids to be fetched from Discord: ${ids.length}.`);
  for (const chunk of chunks) {
    const rolesForChunk = await fetchMembersInChunks(guild, chunk);
    idToRoles = { ...idToRoles, ...rolesForChunk };
    count += chunk.length;
    console.log(`Fetched roles for ids: ${count}.`);
  }

  const uniqueRoles = new Set();
  Object.values(idToRoles).forEach((roles) => roles.forEach((role) => uniqueRoles.add(role)));
  console.log(`Found ${uniqueRoles.size} unique roles.`);

  generateCsv(balances, Array.from(uniqueRoles), idToRoles);
}

function generateCsv(linkedMap, uniqueRoles, idToRoles) {
  let csvContent = 'wallet,id,balance,' + uniqueRoles.join(',') + '\n';

  for (const [wallet, { id, balance }] of Object.entries(linkedMap)) {
    let row = `${wallet},${id},${balance}`;
    uniqueRoles.forEach((role) => {
      row += ',' + (idToRoles[id]?.includes(role) ? 'Yes' : 'No');
    });
    csvContent += row + '\n';
  }

  fs.writeFile('linkedBalancesWithRoles.csv', csvContent, 'utf8', (err) => {
    if (err) {
      console.error('Failed to write to file:', err);
      process.exit(1);
    } else {
      console.log('CSV file with roles has been saved successfully.');
      process.exit(0);
    }
  });
}

const fetchMembersInChunks = async (guild, ids) => {
  const chunkSize = 100;
  const maxRetries = 10;
  const chunkedIds = [];
  for (let i = 0; i < ids.length; i += chunkSize) {
    chunkedIds.push(ids.slice(i, i + chunkSize));
  }

  const fetchChunk = async (chunk, retries = 0) => {
    try {
      const members = await guild.members.fetch({ user: chunk });
      const idToRoles = {};
      members.forEach((member) => {
        idToRoles[member.id] = member.roles.cache.map((r) => r.name);
      });
      return idToRoles;
    } catch (error) {
      if (retries < maxRetries) {
        console.log(`Retrying fetch for chunk. Attempt ${retries + 1}`);
        await new Promise((resolve) => setTimeout(resolve, 2000));
        return fetchChunk(chunk, retries + 1);
      }
      console.error(`Failed to fetch members after ${maxRetries} attempts: ${error}`);
      throw new Error(`Failed to fetch members after ${maxRetries} attempts`);
    }
  };

  const promises = chunkedIds.map((chunk) => fetchChunk(chunk));

  const results = await Promise.all(promises);

  const combinedResults = results.reduce((acc, result) => {
    return { ...acc, ...result };
  }, {});

  return combinedResults;
};

function invertUsersMap(users) {
  const inverted = {};
  for (const key in users) {
    inverted[users[key].toLowerCase()] = key;
  }
  return inverted;
}

function chunkArray(array, chunkSize) {
  const chunks = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }
  return chunks;
}

async function main() {
  const guild = await getGuildInfo();
  const state = await getState();
  const balances = getBalancesMap(state.users, state.balances);
  await processBalances(balances, guild);
  generateCsv(balances);
}

main().catch((e) => console.error);
