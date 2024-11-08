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
  const contract = warp.contract('p5OI99-BaY4QbZts266T7EDwofZqs-wVuYJmMCS0SUU').connect(wallet);
  // const contract = warp.contract('fL3TCkJOZImpr_irwUWQFgasadv4ZUqhld471AoXYb0').connect(wallet);
  await contract.writeInteraction({ function: 'evolve', value: 'atqzS9OtdhpxrGQ5g2gptgFTO4czLqD-fdCy9OVm0TI' });
  // await contract.writeInteraction({ function: 'clearSeasonsAndBoosts', adminId: '769844280767807520' });
})();
