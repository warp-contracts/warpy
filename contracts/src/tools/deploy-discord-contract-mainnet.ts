import fs from 'fs';
import path from 'path';
import { WarpFactory } from 'warp-contracts';
import { ArweaveSigner, DeployPlugin } from 'warp-contracts-plugin-deploy';

(async () => {
  const warp = WarpFactory.forMainnet().use(new DeployPlugin());

  const wallet = JSON.parse(fs.readFileSync(path.resolve('../.secrets', 'wallet.json'), 'utf-8'));
  const contractSrc = fs.readFileSync(
    path.join(__dirname, '../../dist/warpDiscordBot/warpDiscordBotContract.js'),
    'utf8'
  );

  console.log('Source deployment started');
  const src = await warp.createSource({ src: contractSrc }, new ArweaveSigner(wallet));
  const srcId = await warp.saveSource(src);

  const { contractTxId } = await warp.deployFromSourceTx({
    wallet: new ArweaveSigner(wallet),
    srcTxId: srcId,
    initState: JSON.stringify({
      owners: ['0xD284e567A89136406F45614F4D06cdddF4125fBa', '0x64937ab314bc1999396De341Aa66897C30008852'],
      serverName: 'test',
      creationTimestamp: Date.now(),
      ticker: `TEST_TICKER`,
      name: `TEST PST`,
      messagesTokenWeight: 10,
      reactionsTokenWeight: 1,
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
  });
  console.log(contractTxId);
  await console.log(
    `Deployment completed. Checkout contract source in SonAr: https://sonar.warp.cc/#/app/source/${srcId}?network=testnet`
  );
})();
