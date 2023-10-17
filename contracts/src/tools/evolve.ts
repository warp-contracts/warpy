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
  const contract = warp.contract('cyWDtBCA9wxcD3TlW0-JVkW4gl81B4S-LDR5OJo0kWM').connect(wallet);
  await contract.writeInteraction({ function: 'evolve', value: 'dwx8F0RCVsgGz0uYXCo2RrM_9xprhzQV9ev7Avfu2i4' });
  // await contract.writeInteraction({ function: 'countPointsBasedOnCounter', adminId: '769844280767807520' });
})();
