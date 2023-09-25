import fs from 'fs';
import path from 'path';
import { WarpFactory } from 'warp-contracts';
import { ArweaveSigner, DeployPlugin } from 'warp-contracts-plugin-deploy';

(async () => {
  const warp = WarpFactory.forMainnet().use(new DeployPlugin());

  const wallet = JSON.parse(fs.readFileSync(path.resolve('../.secrets', 'wallet.json'), 'utf-8'));
  const contractSrc = fs.readFileSync(path.join(__dirname, '../../dist/servers/serverContract.js'), 'utf8');

  console.log('Contract deployment started');
  const { contractTxId } = await warp.deploy({
    wallet: new ArweaveSigner(wallet),
    src: contractSrc,
    initState: JSON.stringify({ owner: warp.arweave.wallets.jwkToAddress(wallet), evolve: '', servers: {} }),
    evaluationManifest: {
      evaluationOptions: {
        useKVStorage: true,
      },
    },
  });
  console.log(
    `Deployment completed. Checkout contract source in SonAr: https://sonar.warp.cc/#/app/contract/${contractTxId}`
  );
})();
