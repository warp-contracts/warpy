import fs from 'fs';
import path from 'path';
import csvParser from 'csv-parser';
import { WarpFactory, WriteInteractionResponse } from 'warp-contracts';
import { getAddress } from 'ethers';
import { backOff } from 'exponential-backoff';

async function main() {
  const contractId = 'p5OI99-BaY4QbZts266T7EDwofZqs-wVuYJmMCS0SUU';
  const wallet = JSON.parse(fs.readFileSync(path.resolve('./.secrets', 'wallet.json'), 'utf-8'));
  const addresses: { address: string; roles: string; points: number }[] = [];
  const chunkSize = 50;
  const warp = WarpFactory.forMainnet().useGwUrl('https://gw.warp.cc');
  const contract = warp.contract(contractId).connect(wallet).setEvaluationOptions({
    sequencerUrl: 'https://gw.warp.cc/',
  });

  fs.createReadStream(path.resolve('./tools/integration-manta.csv'), { encoding: 'utf-8' })
    .pipe(csvParser())
    .on('data', (chunk) => {
      addresses.push({ address: chunk.address, roles: chunk.sql_roles, points: parseInt(chunk.sql_diff_2) });
    })
    .on('error', (e) => {
      throw new Error(`Error while reading CSV stream. ${e}`);
    })
    .on('end', async () => {
      for (let i = 0; i < addresses.length; i += chunkSize) {
        const chunk = addresses.slice(i, i + chunkSize);
        let members;
        try {
          members = chunk.map((c) => {
            return {
              id: c.address,
              roles: c.roles ? JSON.parse(c.roles) : [],
              points: -c.points,
            };
          });
        } catch (e) {
          console.error(`Chunk has not been successfully processed. Chunk: ${JSON.stringify(chunk)}, error: ${e}.`);
          continue;
        }
        members = members.filter((m) => m.points != 0);
        const addPointsInput = {
          function: 'addPointsForAddress',
          adminId: '769844280767807520',
          members,
          noBoost: false,
          points: 0,
        };
        console.dir(addPointsInput, { depth: null });
        // try {
        //   const { originalTxId } = (await contract.writeInteraction(addPointsInput)) as WriteInteractionResponse;
        //   console.log(`Interaction: ${originalTxId} succeeded.`);
        // } catch (e) {
        //   console.error(`Error while executing interaction: ${JSON.stringify(addPointsInput)}`, e);
        //   break;
        // }
      }
    });
}

main().catch((e) => console.error(e));
