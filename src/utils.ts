import { JWKInterface, Warp, WarpFactory } from 'warp-contracts';
import { DeployPlugin } from 'warp-contracts-plugin-deploy';
import fs from 'fs';
import path from 'path';
import * as ethers from 'ethers';
import { Message } from 'discord.js';

const SERVERS_CONTRACT = '-nqmkSYbvybFDq09YHY3Oo65x_4yVUStd-NYx1TIkwY';
export const DAILY_MESSAGES_LIMIT = 100;
export const DAILY_REACTIONS_LIMIT = 100;

export function isEthWallet(txId: string): boolean {
  return ethers.isAddress(txId);
}

export async function connectToServerContract(warp: Warp, wallet: JWKInterface, serverId: string | null) {
  const contractTxId = await getServerContractId(serverId);
  return warp.contract(contractTxId).connect(wallet).setEvaluationOptions({ useKVStorage: true });
}

export async function getServerContractId(serverId: string | null) {
  if (!serverId) {
    throw new Error(`Server id not provided. Cannot connect to the contract.`);
  } else {
    const result = await getStateFromDre(SERVERS_CONTRACT);
    return result.state.servers[serverId].contractTxId;
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

export async function getStateFromDre(contractId: string, propertyToGet?: string, id?: string) {
  const dre1 = `dre-1`;
  const dre3 = `dre-3`;
  const dre5 = `dre-5`;
  try {
    const response = await fetchDre(dre1, contractId, propertyToGet, id);
    return response;
  } catch (e) {
    try {
      const response = await fetchDre(dre3, contractId, propertyToGet, id);
      return response;
    } catch (e) {
      try {
        const response = await fetchDre(dre5, contractId, propertyToGet, id);
        return response;
      } catch (e) {
        throw new Error(`Could not load state from DRE nodes.`);
      }
    }
  }
}

async function fetchDre(dre: string, contractId: string, propertyToGet?: string, id?: string) {
  return await fetch(
    `https://${dre}.warp.cc/contract?id=${contractId}${
      propertyToGet ? `&query=$.${propertyToGet}${id ? `.${id}` : ''}` : ''
    }`
  ).then((res) => {
    return res.json();
  });
}

export function getMessageArgs(message: Message) {
  return message.content.trim().split(/ +/g);
}

export const warpyIconUrl =
  'https://citcz3hukepydjkha2c4lthzf6mhxlzqxvtpgcwr2gx3tmg2mwlq.arweave.dev/EiYs7PRRH4GlRwaFxcz5L5h7rzC9ZvMK0dGvubDaZZc';

export const errorEmbed = (errorMessage: string) => {
  return {
    content: `An error has occured.`,
    tts: true,
    embeds: [
      {
        type: 'rich',
        color: 0xdd72cb,
        fields: [
          {
            name: `Reason for error`,
            value: `${errorMessage}`,
          },
        ],
      },
    ],
  };
};
