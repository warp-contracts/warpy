import fs from 'fs';
import path from 'path';
import { WarpFactory } from 'warp-contracts';
import { ArweaveSigner, DeployPlugin } from 'warp-contracts-plugin-deploy';

(async () => {
  const warp = WarpFactory.forMainnet().use(new DeployPlugin());

  const wallet = JSON.parse(fs.readFileSync(path.resolve('../.secrets', 'wallet.json'), 'utf-8'));
  // const contractSrc = fs.readFileSync(
  //   path.join(__dirname, '../../dist/warpDiscordBot/warpDiscordBotContract.js'),
  //   'utf8'
  // );

  // console.log('Source deployment started');
  // const src = await warp.createSource({ src: contractSrc }, new ArweaveSigner(wallet));
  // const srcId = await warp.saveSource(src);

  // console.log(srcId);

  const { contractTxId } = await warp.deployFromSourceTx({
    wallet: new ArweaveSigner(wallet),
    srcTxId: '5P_wgG2n_bCrzP_GsCliSn02avFMspageU9bTx-3nig',
    initState: JSON.stringify({
      owners: [
        '0xD284e567A89136406F45614F4D06cdddF4125fBa',
        '0x64937ab314bc1999396De341Aa66897C30008852',
        'ESCLmn6txFGgK-XO2U6svB1543n2SoGTB29Aptnj9v0',
      ],
      serverName: 'TEST_SERVER',
      creationTimestamp: Date.now(),
      ticker: 'TEST_SERVER_TICKER',
      name: 'Test Server',
      messagesTokenWeight: 100,
      reactionsTokenWeight: 10,
      balances: {},
      users: {},
      messages: {},
      boosts: {},
      seasons: {},
      reactions: {
        max: 5,
        timeLagInSeconds: 50,
      },
      rouletteEntry: 500,
      divisibility: 1000,
      rouletteOn: false,
      admins: ['304935610089734150', '769844280767807520'],
    }),
    evaluationManifest: {
      evaluationOptions: {
        useKVStorage: true,
      },
    },
  });
  console.log(contractTxId);
  // await console.log(
  //   `Deployment completed. Checkout contract source in SonAr: https://sonar.warp.cc/#/app/source/${srcId}?network=testnet`
  // );
})();
