import { WarpFactory } from 'warp-contracts';
import path from 'path';
import fs from 'fs';

async function main() {
  const wallet = JSON.parse(fs.readFileSync(path.resolve('./.secrets', 'wallet.json'), 'utf-8'));
  const warp = WarpFactory.forMainnet();
  const contract = warp.contract('2SbvbiZGD_CQD4-nf3xAWIbrbY2FXtPQ6ghPd42IeS0').connect(wallet);

  await contract.writeInteraction({ function: 'addAdmin', id: '769844280767807520' });
}

main().catch((e) => console.log(e));
