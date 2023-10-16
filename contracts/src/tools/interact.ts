import { WarpFactory } from 'warp-contracts';
import path from 'path';
import fs from 'fs';
import { VRFPlugin } from 'warp-contracts-plugin-vrf';

async function main() {
  const wallet = JSON.parse(fs.readFileSync(path.resolve('../.secrets', 'wallet.json'), 'utf-8'));
  const warp = WarpFactory.forMainnet().use(new VRFPlugin());
  const contract = warp.contract('DNImANuY_SKqVlqGl43FRj0zKNXKrsqb0Xg0L6r-NV8').connect(wallet);

  // const { cachedValue } = await contract.readState();
  // console.log(cachedValue.state);
  await contract.writeInteraction({ function: 'countPointsBasedOnCounter', adminId: '769844280767807520' });
}

main().catch((e) => console.log(e));
