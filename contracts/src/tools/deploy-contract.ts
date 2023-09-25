import fs from 'fs';
import path from 'path';
import { WarpFactory } from 'warp-contracts';
import { DeployPlugin } from 'warp-contracts-plugin-deploy';

(async () => {
  const warp = WarpFactory.forMainnet().use(new DeployPlugin());
  let wallet: any;
  let walletDir = path.resolve('.secrets');
  let walletFilename = path.join(walletDir, `/wallet_${warp.environment}.json`);
  if (fs.existsSync(walletFilename)) {
    wallet = walletFilename;
  } else {
    ({ jwk: wallet } = await warp.generateWallet());
    if (!fs.existsSync(walletDir)) fs.mkdirSync(walletDir);
    fs.writeFileSync(walletFilename, JSON.stringify(wallet));
  }
  const contractSrc = fs.readFileSync(path.join(__dirname, '../../dist/contract.js'), 'utf8');

  const initialState = {};

  console.log('Deployment started');
  const { contractTxId } = await warp.deploy({
    wallet,
    initState: JSON.stringify(initialState),
    src: contractSrc,
  });
  console.log(`Deployment completed. Checkout contract in SonAr: https://sonar.warp.cc/#/app/contract/${contractTxId}`);
})();
``;
