import { WarpFactory } from 'warp-contracts';
import path from 'path';
import fs from 'fs';
import { VRFPlugin } from 'warp-contracts-plugin-vrf';

async function main() {
  const wallet = JSON.parse(fs.readFileSync(path.resolve('../.secrets', 'wallet.json'), 'utf-8'));
  const warp = WarpFactory.forMainnet().use(new VRFPlugin());
  const contract = warp.contract('p5OI99-BaY4QbZts266T7EDwofZqs-wVuYJmMCS0SUU').connect(wallet);

  // const { cachedValue } = await contract.readState();
  // console.log(cachedValue.state);
  await contract.writeInteraction({ function: 'addRouletteEntry', adminId: '769844280767807520', rouletteEntry: 500 });
  // const test = await contract.viewState({
  //   function: 'getRoulettePick',
  //   userId: '769844280767807520',
  //   interactionId: '1165642682593464341',
  // });
  // console.log(test);
}

main().catch((e) => console.log(e));
