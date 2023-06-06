import { Guild } from 'discord.js';
import { Contract, JWKInterface, Tag, Warp } from 'warp-contracts';
import { ArweaveSigner } from 'warp-contracts-plugin-deploy';

const BOT_CONTRACT_SRC = 'JmIkZyGdwPnR_4y41AOsBH0Sx0jiNySLHlDh94iZs4A';

export async function onGuildCreate(guild: Guild, warp: Warp, wallet: JWKInterface, serversContract: Contract) {
  const { contractTxId } = await warp.deployFromSourceTx({
    wallet: new ArweaveSigner(wallet),
    srcTxId: BOT_CONTRACT_SRC,
    initState: JSON.stringify({
      owner: warp.arweave.wallets.jwkToAddress(wallet),
      serverName: guild.name,
      creationTimestamp: Date.now(),
      ticker: `${guild.name.toUpperCase().replace(/ /g, '_')}_TICKER`,
      name: `${guild.name} PST`,
      messagesTokenWeight: 100,
      reactionsTokenWeight: 10,
      balances: {},
      messages: {},
      users: {},
      counter: {},
    }),
    evaluationManifest: {
      evaluationOptions: {
        useKVStorage: true,
      },
    },
    tags: [new Tag('Discord-Server-Name', guild.name), new Tag('Indexed-By', 'warp-discord-bot')],
  });

  console.log(`New server created. Server name: ${guild.name}, contractId: ${contractTxId}`);
  await serversContract.writeInteraction({
    function: 'registerServer',
    serverId: guild.id,
    serverName: guild.name,
    contractTxId,
  });
}
