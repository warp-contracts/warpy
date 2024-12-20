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
    function: 'addRoulettePicks',
    roulettePicks: [
      { value: 1000, weight: 400 },
      { value: 5000, weight: 300 },
      { value: 10000, weight: 200 },
      { value: 100000, weight: 70 },
      { value: 500000, weight: 30 },
    ],
    adminId: '769844280767807520',
  });

  // await contract.writeInteraction({
  //   function: 'addPointsWithCap',
  //   points: 0,
  //   adminId: '769844280767807520',
  //   members: [
  //     {
  //       id: '0xf77A7AE533091c1102b2aC8231e393121911028E',
  //       roles: [
  //         'Server Booster',
  //         'Twitter',
  //         'Dev',
  //         'Announcements',
  //         'Miner',
  //         'Ore Digger',
  //         'Rock Breaker',
  //         '🥚Egg Hunter',
  //         '@everyone',
  //       ],
  //       txId: '',
  //       points: 339,
  //     },
  //     {
  //       id: '0x1D48F5C6a1C5c50226dC0d7EfC16C1A46aDB2F14',
  //       roles: [
  //         'Twitter',
  //         'Dev',
  //         'Announcements',
  //         'Miner',
  //         'Ore Digger',
  //         'Vein Master',
  //         'Rock Breaker',
  //         'timeout squad',
  //         'Games',
  //         '👑 Meme king',
  //         'Season I',
  //         'Weekly Task',
  //         'GelatoQuiz',
  //         '@everyone',
  //       ],
  //       txId: '',
  //       points: 253,
  //     },
  //     {
  //       id: '0xD9Fa0a8D7Ed193D1b020f9d4b6888407E6382c04',
  //       roles: [
  //         'Twitter',
  //         'Announcements',
  //         'Miner',
  //         'Ore Digger',
  //         'Rock Breaker',
  //         'Games',
  //         '🥚Egg Hunter',
  //         'Season I',
  //         'Champion',
  //         '@everyone',
  //       ],
  //       txId: '',
  //       points: 191,
  //     },
  //     {
  //       id: '0xb21bDC8AE300AcaB8b4B19E75fA72F669F85c5bE',
  //       roles: [
  //         'Server Booster',
  //         'Twitter',
  //         'Announcements',
  //         'Miner',
  //         'Ore Digger',
  //         'Rock Breaker',
  //         'Season I',
  //         'Weekly Task',
  //         'GelatoQuiz',
  //         '@everyone',
  //       ],
  //       txId: '',
  //       points: 2,
  //     },
  //     {
  //       id: '0x645f06B605D72Dd77509cDF1646162eB607b623f',
  //       roles: [
  //         'Server Booster',
  //         'Dev',
  //         'Miner',
  //         'Ore Digger',
  //         'Rock Breaker',
  //         'Games',
  //         'Season I',
  //         'GelatoQuiz',
  //         '@everyone',
  //       ],
  //       txId: '',
  //       points: 1275,
  //     },
  //     {
  //       id: '0xdfBaeeF21396BF205D4B7D23345155489072Cf9B',
  //       roles: ['Server Booster', 'Miner', 'Ore Digger', 'Rock Breaker', 'Games', '@everyone'],
  //       txId: '',
  //       points: 4994,
  //     },
  //     {
  //       id: '0x7CB414C6230CD0e460C1674cF0253349259D6e02',
  //       roles: [
  //         'Twitter',
  //         'Announcements',
  //         'Miner',
  //         'Ore Digger',
  //         'Rock Breaker',
  //         '🎄Elven Squad',
  //         'Games',
  //         '🥚Egg Hunter',
  //         'Season I',
  //         'Weekly Task',
  //         '@everyone',
  //       ],
  //       txId: '',
  //       points: 122,
  //     },
  //     {
  //       id: '0xf15E6BC2A1f080A1DbC31B0070d333ae5Ff848DE',
  //       roles: [
  //         'Twitter',
  //         'Announcements',
  //         'Miner',
  //         'Ore Digger',
  //         'Rock Breaker',
  //         'Games',
  //         'Season I',
  //         'Weekly Task',
  //         '@everyone',
  //       ],
  //       txId: '',
  //       points: 9,
  //     },
  //     {
  //       id: '0xA1b99875425d038bfF22571a29D5e791C8a9716A',
  //       roles: [
  //         'Server Booster',
  //         'Twitter',
  //         'Dev',
  //         'Announcements',
  //         'Miner',
  //         'Ore Digger',
  //         'Rock Breaker',
  //         '🎄Elven Squad',
  //         'Games',
  //         'Season I',
  //         '@everyone',
  //       ],
  //       txId: '',
  //       points: 1165,
  //     },
  //     {
  //       id: '0xceC771B3AB9204c4EB0B731111658e7C8bA539cF',
  //       roles: [
  //         'Server Booster',
  //         'Twitter',
  //         '✨GR15',
  //         'Verified',
  //         'Dev',
  //         'Announcements',
  //         '⛏️Early Miner',
  //         'Ore Digger',
  //         'Games',
  //         'Season I',
  //         '@everyone',
  //       ],
  //       txId: '',
  //       points: 6130,
  //     },
  //     {
  //       id: '0x0936106A11931375C231427b9C764d3647142C75',
  //       roles: ['Twitter', 'Dev', 'Announcements', 'Ore Digger', '@everyone'],
  //       txId: '',
  //       points: 5,
  //     },
  //     {
  //       id: '0x0C8Cdea8e2E53eA2059077670aAa551d10776195',
  //       roles: ['Twitter', 'Dev', 'Announcements', 'Miner', 'Ore Digger', 'Rock Breaker', '@everyone'],
  //       txId: '',
  //       points: 2,
  //     },
  //   ],
  //   noBoost: false,
  //   cap: 208333,
  //   initialCapInteraction: false,
  // });
  // const test = await contract.viewState({
  //   function: 'getRoulettePick',
  //   userId: '769844280767807520',
  //   interactionId: '1165642682593464341',
  // });
  // console.log(test);
}

main().catch((e) => console.log(e));
