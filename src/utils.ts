import { JWKInterface, Warp, WarpFactory } from 'warp-contracts';
import { DeployPlugin } from 'warp-contracts-plugin-deploy';
import fs from 'fs';
import path from 'path';
import * as ethers from 'ethers';
import { Message } from 'discord.js';
import { VRFPlugin } from 'warp-contracts-plugin-vrf';

const SERVERS_CONTRACT = 'ESC8nqUQB6yFPtZJ1homWzsA1CXzcWTkp3mvvwcNikU';
export const REDSTONE_SERVER_CONTRACT_ID = 'p5OI99-BaY4QbZts266T7EDwofZqs-wVuYJmMCS0SUU';
export const DAILY_MESSAGES_LIMIT = 100;
export const DAILY_REACTIONS_LIMIT = 100;
export const DRE_WARPY = 'https://dre-warpy.warp.cc';

export function isEthWallet(txId: string): boolean {
  return ethers.isAddress(txId);
}

export async function connectToServerContract(warp: Warp, wallet: JWKInterface, serverId: string | null) {
  const contractTxId = REDSTONE_SERVER_CONTRACT_ID;
  // const contractTxId = await getServerContractId(serverId);
  return warp
    .contract(contractTxId)
    .connect(wallet)
    .setEvaluationOptions({ useKVStorage: true, sequencerUrl: 'https://gw.warp.cc/' });
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
  return WarpFactory.forMainnet().use(new DeployPlugin()).use(new VRFPlugin()).useGwUrl('https://gw.warp.cc');
}

export function connectToServersContract(warp: Warp, wallet: JWKInterface) {
  return warp
    .contract(SERVERS_CONTRACT)
    .connect(wallet)
    .setEvaluationOptions({ useKVStorage: true, sequencerUrl: 'https://gw.warp.cc/' });
}

export function readWallet() {
  return JSON.parse(fs.readFileSync(path.resolve('.secrets', 'wallet.json'), 'utf-8'));
}

export async function getStateFromDre(contractId: string, propertyToGet?: string, id?: string) {
  try {
    const response = await fetchDreWarpy(contractId, propertyToGet, id);
    return response;
  } catch (e) {
    console.error(`Failed to fetch state from dre`, e);
    throw new Error(`Could not load state from DRE nodes.`);
  }
}

async function fetchDreWarpy(contractId: string, propertyToGet?: string, id?: string) {
  if (propertyToGet) {
    return await fetch(
      `https://dre-warpy.warp.cc/pg/contract?id=${contractId}&query=$.${propertyToGet}${id ? `."${id}"` : ''}`
    ).then((res) => {
      return res.json();
    });
  }
  return await fetch(`https://dre-warpy.warp.cc/contract?id=${contractId}`).then((res) => {
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
        color: 0x6c8cfd,
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

export const getSonarContractUrl = (contractId: string, withState?: boolean) => {
  return `https://sonar.warp.cc/#/app/contract/${contractId}?network=mainnet&dre=dreWarpy${
    withState ? '#current-state' : ''
  }`;
};

export const getSonarInteractionUrl = (interactionId: string) => {
  return `https://sonar.warp.cc/#/app/interaction/${interactionId}?network=mainnet&dre=dreWarpy`;
};

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
