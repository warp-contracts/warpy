import { Contract, JWKInterface, Warp, WarpFactory } from 'warp-contracts';
import { DeployPlugin } from 'warp-contracts-plugin-deploy';
import fs from 'fs';
import path from 'path';

const SERVERS_CONTRACT = '_5SNf0nR2zVmSp6Gw58V1l4IaJnL1r3AHFSLZoMDnWM';
export const DAILY_MESSAGES_LIMIT = 100;
export const DAILY_REACTIONS_LIMIT = 100;

export function isTxIdValid(txId: string): boolean {
  const validTxIdRegex = /[a-z0-9_-]{43}/i;
  return validTxIdRegex.test(txId);
}

export async function connectToServerContract(
  warp: Warp,
  serversContract: Contract,
  wallet: JWKInterface,
  serverId: string | null
) {
  if (!serverId) {
    throw new Error(`Server id not provided. Cannot connect to the contract.`);
  } else {
    const contractTxId = (
      await serversContract.viewState<
        { function: string; serverId: string | null },
        { serverName: string; serverId: string; contractTxId: string }
      >({
        function: 'getServerInfo',
        serverId,
      })
    ).result.contractTxId;

    return warp.contract(contractTxId).connect(wallet).setEvaluationOptions({ useKVStorage: true });
  }
}

export function initializeWarp(): Warp {
  return WarpFactory.forMainnet().use(new DeployPlugin());
}

export function connectToServersContract(warp: Warp, wallet: JWKInterface) {
  return warp.contract(SERVERS_CONTRACT).connect(wallet).setEvaluationOptions({ useKVStorage: true });
}

export function readWallet() {
  return JSON.parse(fs.readFileSync(path.resolve('.secrets', 'wallet.json'), 'utf-8'));
}

export async function getStateFromDre(contractId: string, propertyToGet: string, walletAddress: string) {
  const dre1 = `dre-1`;
  const dre3 = `dre-3`;
  const dre5 = `dre-5`;
  try {
    const response = await fetchDre(dre1, contractId, propertyToGet, walletAddress);
    return response.result;
  } catch (e) {
    try {
      const response = await fetchDre(dre3, contractId, propertyToGet, walletAddress);
      return response.result;
    } catch (e) {
      try {
        const response = await fetchDre(dre5, contractId, propertyToGet, walletAddress);
        return response.result;
      } catch (e) {
        throw new Error(`Could not load state from DRE nodes.`);
      }
    }
  }
}

async function fetchDre(dre: string, contractId: string, propertyToGet: string, walletAddress: string) {
  return await fetch(`https://${dre}.warp.cc/contract?id=${contractId}&query=$.${propertyToGet}.${walletAddress}`).then(
    (res) => {
      return res.json();
    }
  );
}
