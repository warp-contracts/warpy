import { Guild } from 'discord.js';
import { Tag, Warp } from 'warp-contracts';
import { ArweaveSigner } from 'warp-contracts-plugin-deploy';

const BOT_CONTRACT_SRC = '-T_k7g5CtfgIN2LecCJY-SZ-X_aloZL74d9uuDBkH6Y';

export default {
  name: 'guildCreate',
  async execute(guild: Guild, warp: Warp, wallet: any, serversContract: any) {
    const walletAddress = await warp.arweave.wallets.jwkToAddress(wallet);
    const { contractTxId } = await warp.deployFromSourceTx({
      wallet: new ArweaveSigner(wallet),
      srcTxId: BOT_CONTRACT_SRC,
      initState: JSON.stringify({
        owner: walletAddress,
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
        admins: [],
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
