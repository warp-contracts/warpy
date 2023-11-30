import fs from 'fs';
import path from 'path';
import csvParser from 'csv-parser';
import { WarpFactory, WriteInteractionResponse } from 'warp-contracts';
import { getAddress } from 'ethers';
import { backOff } from 'exponential-backoff';

async function main() {
  if (!process.argv.slice(2)[0]) {
    throw new Error(`No points passed to the script.`);
  }
  if (isNaN(Number(process.argv.slice(2)[0]))) {
    throw new Error(`Incorrect points format.`);
  }
  const points = Number(process.argv.slice(2)[0]);
  // const contractId = 'XsLcIh8FYu3N8RFBoIpVhy5J2TSCydDhPwkSII0HHdo';
  const contractId = 'p5OI99-BaY4QbZts266T7EDwofZqs-wVuYJmMCS0SUU';

  const wallet = JSON.parse(fs.readFileSync(path.resolve('./.secrets', 'wallet.json'), 'utf-8'));
  const addresses: { id: string; address: string }[] = [];
  const chunkSize = Number(process.argv.slice(3)[0]) || 150;
  const warp = WarpFactory.forMainnet();
  const contract = warp.contract(contractId).connect(wallet);

  let users: { [id: string]: string };
  try {
    users = (
      await fetch(`https://dre-warpy.warp.cc/contract?id=${contractId}&query=$.users`).then((res) => {
        return res.json();
      })
    ).result[0];
  } catch (e) {
    throw new Error(`Could not load state from DRE node.`);
  }

  fs.createReadStream(path.resolve('./tools/data.csv'), { encoding: 'utf-8' })
    .pipe(csvParser())
    .on('data', (chunk) => {
      addresses.push(chunk);
    })
    .on('error', (e) => {
      throw new Error(`Error while reading CSV stream. ${e}`);
    })
    .on('end', async () => {
      for (let i = 0; i < addresses.length; i += chunkSize) {
        const chunk = addresses.slice(i, i + chunkSize);
        let members;
        try {
          members = await Promise.all(
            chunk.map(async (c) => {
              let roles;
              const userId = Object.keys(users).find((u) => users[u] == c.address || users[u] == getAddress(c.address));

              if (userId) {
                const request = async () => {
                  return fetch(`https://api-warpy.warp.cc/v1/userRoles?id=${userId}`).then((res) => {
                    return res.ok ? res.json() : Promise.reject(res);
                  });
                };
                try {
                  roles = (await backOff(request, {
                    delayFirstAttempt: false,
                    maxDelay: 1000,
                    numOfAttempts: 5,
                  })) as any;
                  return {
                    id: users[userId],
                    roles,
                  };
                } catch (e: any) {
                  console.log(
                    `Error while fetching user (address: ${c.address}, id: ${userId}) roles. ${JSON.stringify(e)}`
                  );
                  return {
                    id: getAddress(c.address),
                    roles: [],
                  };
                }
              } else {
                return {
                  id: getAddress(c.address),
                  roles: [],
                };
              }
            })
          );
        } catch (e) {
          console.error(`Chunk has not been successfully processed. Chunk: ${JSON.stringify(chunk)}, error: ${e}.`);
          continue;
        }
        const addPointsInput = {
          function: 'addPointsCsv',
          points,
          adminId: '769844280767807520',
          members,
          noBoost: true,
        };
        try {
          const { originalTxId } = (await contract.writeInteraction(addPointsInput)) as WriteInteractionResponse;
          console.log(`Interaction: ${originalTxId} succeeded.`);
        } catch (e) {
          console.error(`Error while executing interaction: ${JSON.stringify(addPointsInput)}`, e);
          break;
        }
      }
    });
}

main().catch((e) => console.error(e));
