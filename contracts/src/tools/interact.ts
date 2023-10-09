import { WarpFactory } from 'warp-contracts';
import path from 'path';
import fs from 'fs';

async function main() {
  const wallet = JSON.parse(fs.readFileSync(path.resolve('../.secrets', 'wallet.json'), 'utf-8'));
  const warp = WarpFactory.forMainnet();
  const contract = warp.contract('p5OI99-BaY4QbZts266T7EDwofZqs-wVuYJmMCS0SUU').connect(wallet);

  await contract.writeInteraction({ function: 'countPointsBasedOnCounter', adminId: '769844280767807520' });
}

main().catch((e) => console.log(e));
