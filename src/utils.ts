import { Contract, JWKInterface, Warp } from 'warp-contracts';

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
