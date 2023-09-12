import { Guild } from 'discord.js';
import { Tag, Warp } from 'warp-contracts';
import { ArweaveSigner } from 'warp-contracts-plugin-deploy';

const BOT_CONTRACT_SRC = 'yBsXcWTZclkijlJ-ADEYszpDf1xil-YXFVfW83OIJlk';

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
        messagesTokenWeight: 100,
        reactionsTokenWeight: 10,
        balances: {},
        messages: {},
        users: {},
        counter: {},
        boosts: {},
        admins: ['304935610089734150', '769844280767807520'],
        seasons: {},
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
