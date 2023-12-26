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
  await contract.writeInteraction({
    // function: 'addPoints',
    // roulettePicks: [
    //   { value: 1, weight: 404 },
    //   { value: 250, weight: 300 },
    //   { value: 500, weight: 200 },
    //   { value: 1000, weight: 50 },
    //   { value: 5000, weight: 40 },
    //   { value: 10000, weight: 5 },
    //   { value: 100000, weight: 1 },
    // ],
    // adminId: '769844280767807520',
    function: 'addPoints',
    points: 5,
    adminId: '769844280767807520',
    members: [{ id: '769844280767807520', roles: 'user' }],
    noBoost: true,
  });
  // const test = await contract.viewState({
  //   function: 'getRoulettePick',
  //   userId: '769844280767807520',
  //   interactionId: '1165642682593464341',
  // });
  // console.log(test);
}

main().catch((e) => console.log(e));
