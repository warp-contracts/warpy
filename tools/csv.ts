import fs from 'fs';
import path from 'path';
import csvParser from 'csv-parser';
import { defaultCacheOptions, WarpFactory, WriteInteractionResponse } from 'warp-contracts';
import { getAddress } from 'ethers';
import { backOff } from 'exponential-backoff';

async function main() {
  // if (!process.argv.slice(2)[0]) {
  //   throw new Error(`No points passed to the script.`);
  // }
  // if (isNaN(Number(process.argv.slice(2)[0]))) {
  //   throw new Error(`Incorrect points format.`);
  // }
  // const points = Number(process.argv.slice(2)[0]);
  // const contractId = 'XsLcIh8FYu3N8RFBoIpVhy5J2TSCydDhPwkSII0HHdo';
  const contractId = 'p5OI99-BaY4QbZts266T7EDwofZqs-wVuYJmMCS0SUU';

  const wallet = JSON.parse(fs.readFileSync(path.resolve('./.secrets', 'wallet.json'), 'utf-8'));
  // const addresses: { users: string; xvs_staked_amount: string }[] = [];
  const chunkSize = Number(process.argv.slice(3)[0]) || 150;
  // const warp = WarpFactory.forMainnet().useGwUrl('https://gw.warp.cc');
  // const contract = warp.contract(contractId).connect(wallet).setEvaluationOptions({
  //   sequencerUrl: 'https://gw.warp.cc/',
  // });

  // let users: { [id: string]: string };
  // try {
  //   users = (
  //     await fetch(`https://dre-warpy.warp.cc/contract?id=${contractId}&query=$.users`).then((res) => {
  //       return res.json();
  //     })
  //   ).result[0];
  // } catch (e) {
  //   throw new Error(`Could not load state from DRE node.`);
  // }

  // fs.writeFileSync('users.json', JSON.stringify(users));
  let users = JSON.parse(fs.readFileSync('venus-filtered.json', 'utf-8'));

  const addresses = users.map((u: any) => u.users);
  const usersIds = (
    await fetch(`https://dre-warpy.warp.cc/warpy/fixed/user-ids`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=UTF-8',
        Accept: 'application/json',
      },
      body: JSON.stringify({ addresses }),
    }).then((res) => res.json())
  )?.['wallet_to_id'];

  const ids = Object.keys(usersIds).map((a) => usersIds[a.toLowerCase()]);

  const usersRoles = (
    await fetch(`https://api-warpy.warp.cc/v1/usersRoles?ids=${ids}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=UTF-8',
        Accept: 'application/json',
      },
      body: JSON.stringify({ ids }),
    }).then((res) => res.json())
  )?.['id_to_roles'];

  console.log(Object.keys(usersRoles).length);

  const addressToRoles: any = {};
  for (let address of addresses) {
    const userId = usersIds[address.toLowerCase()];
    if (userId) {
      addressToRoles[address] = usersRoles[userId];
    } else {
      continue;
    }
  }

  const warp = WarpFactory.forMainnet({ ...defaultCacheOptions, inMemory: true });
  const contract = warp
    .contract(contractId)
    .setEvaluationOptions({
      sequencerUrl: 'https://gw.warp.cc/',
    })
    .connect(wallet);

  const members = Object.entries(addressToRoles).map(([address, roles]) => {
    return {
      id: address,
      roles: roles || [],
      points:
        parseInt(users.find((u: any) => u.users.toLowerCase() == address.toLowerCase())[`xvs_staked_amount`]) || 0,
    };
  });

  console.log(members.length);

  const addPointsInput = {
    function: 'addPointsWithCap',
    adminId: '769844280767807520',
    members,
    cap: 10000000,
    initialCapInteraction: true,
  };
  console.log(`writing interaction to Warpy..., ${JSON.stringify(addPointsInput)}`);
  const test = await contract.writeInteraction(addPointsInput);
  console.log(test);
  // const reduced = users.reduce((a: any, b: any) => a + parseFloat(b.xvs_staked_amount), 0);
  // console.log(reduced);
  // fs.createReadStream(path.resolve('./tools/venus.csv'), { encoding: 'utf-8' })
  //   .pipe(csvParser())
  //   .on('data', (chunk) => {
  //     addresses.push(chunk);
  //   })
  //   .on('error', (e) => {
  //     throw new Error(`Error while reading CSV stream. ${e}`);
  //   })
  //   .on('end', async () => {
  //     // const addressesFiltered = addresses.filter((a) =>
  //     //   Object.keys(users).find((u) => users[u].toLowerCase() == a.users.toLowerCase())
  //     // );
  //     // console.log(Object.keys(addressesFiltered).length);
  //     // fs.writeFileSync('venus-filtered.json', JSON.stringify(addressesFiltered));
  //     const reduced = users.reduce((a, b) => a + parseInt(b.xvs_staked_amount), 0);
  //     console.log(reduced);
  //     // for (let i = 0; i < addresses.length; i += chunkSize) {
  //     //   const chunk = addresses.slice(i, i + chunkSize);
  //     //   let members;
  //     //   try {
  //     //     members = await Promise.all(
  //     //       chunk.map(async (c) => {
  //     //         let roles;
  //     //         const userId = Object.keys(users).find(
  //     //           (u) =>
  //     //             users[u].toLowerCase() == c.address.toLowerCase() ||
  //     //             users[u].toLowerCase() == getAddress(c.address).toLowerCase()
  //     //         );
  //     //         if (userId) {
  //     //           const request = async () => {
  //     //             return fetch(`https://api-warpy.warp.cc/v1/userRoles?id=${userId}`).then((res) => {
  //     //               return res.ok ? res.json() : Promise.reject(res);
  //     //             });
  //     //           };
  //     //           try {
  //     //             roles = (await backOff(request, {
  //     //               delayFirstAttempt: false,
  //     //               maxDelay: 1000,
  //     //               numOfAttempts: 5,
  //     //             })) as any;
  //     //             return {
  //     //               id: users[userId],
  //     //               roles,
  //     //             };
  //     //           } catch (e: any) {
  //     //             console.log(
  //     //               `Error while fetching user (address: ${c.address}, id: ${userId}) roles. ${JSON.stringify(e)}`
  //     //             );
  //     //             return {
  //     //               id: getAddress(c.address),
  //     //               roles: [],
  //     //             };
  //     //           }
  //     //         } else {
  //     //           return {
  //     //             id: getAddress(c.address),
  //     //             roles: [],
  //     //           };
  //     //         }
  //     //       })
  //     //     );
  //     //   } catch (e) {
  //     //     console.error(`Chunk has not been successfully processed. Chunk: ${JSON.stringify(chunk)}, error: ${e}.`);
  //     //     continue;
  //     //   }
  //     //   const addPointsInput = {
  //     //     function: 'addPointsForAddress',
  //     //     points,
  //     //     adminId: '769844280767807520',
  //     //     members,
  //     //     noBoost: true,
  //     //   };
  //     //   try {
  //     //     const { originalTxId } = (await contract.writeInteraction(addPointsInput)) as WriteInteractionResponse;
  //     //     console.log(`Interaction: ${originalTxId} succeeded.`);
  //     //   } catch (e) {
  //     //     console.error(`Error while executing interaction: ${JSON.stringify(addPointsInput)}`, e);
  //     //     break;
  //     //   }
  //     // }
  //   });
}

main().catch((e) => console.error(e));
