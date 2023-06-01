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
  await console.log(
    `Deployment completed. Checkout contract source in SonAr: https://sonar.warp.cc/#/app/source/${srcId}?network=testnet`
  );
})();
