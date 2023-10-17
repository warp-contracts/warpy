import { Guild } from 'discord.js';
import { Tag, Warp } from 'warp-contracts';
import { ArweaveSigner } from 'warp-contracts-plugin-deploy';

const BOT_CONTRACT_SRC = 'Mp2I319hteB4UxLldiHuv9QRa1QJ9LwDjkT6BDVtFGU';

export default {
  name: 'guildCreate',
  async execute(guild: Guild, warp: Warp, wallet: any, serversContract: any) {
    const walletAddress = await warp.arweave.wallets.jwkToAddress(wallet);
    const { contractTxId } = await warp.deployFromSourceTx({
      wallet: new ArweaveSigner(wallet),
      srcTxId: BOT_CONTRACT_SRC,
      initState: JSON.stringify({
        owners: [
          '0xD284e567A89136406F45614F4D06cdddF4125fBa',
          '0x64937ab314bc1999396De341Aa66897C30008852',
          walletAddress,
        ],
        serverName: guild.name,
        creationTimestamp: Date.now(),
        ticker: `${guild.name.toUpperCase().replace(/ /g, '_')}_TICKER`,
        name: `${guild.name} PST`,
        messagesTokenWeight: 10,
        reactionsTokenWeight: 1,
        balances: {},
        users: {},
        counter: {},
        boosts: {},
        admins: ['304935610089734150', '769844280767807520'],
        seasons: {},
        reactions: {
          max: 10,
          timeLagInSeconds: 3600,
        },
        roulettePicks: [
          {
            value: 1,
            weight: 400,
          },
          {
            value: 250,
            weight: 270,
          },
          {
            value: 500,
            weight: 200,
          },
          {
            value: 1000,
            weight: 95,
          },
          {
            value: 10000,
            weight: 25,
          },
          {
            value: 100000,
            weight: 10,
          },
        ],
        rouletteOn: false,
        rouletteEntry: 500,
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
  },
};
