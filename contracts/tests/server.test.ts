import ArLocal from 'arlocal';
import { JWKInterface } from 'arweave/node/lib/wallet';
import fs from 'fs';
import path from 'path';
import { DeployPlugin } from 'warp-contracts-plugin-deploy';
import { ContractState } from '../src/servers/types/types';
import { LoggerFactory, Warp, WarpFactory, Contract } from 'warp-contracts';

jest.setTimeout(30000);

describe('Testing Contract contract', () => {
  let ownerWallet: JWKInterface;
  let owner: string;

  let initialState: ContractState;

  let arlocal: ArLocal;
  let warp: Warp;
  let contract: Contract<ContractState>;

  let contractSrc: string;

  let contractId: string;

  beforeAll(async () => {
    arlocal = new ArLocal(1821, false);
    await arlocal.start();

    LoggerFactory.INST.logLevel('error');

    warp = WarpFactory.forLocal(1821).use(new DeployPlugin());

    ({ jwk: ownerWallet, address: owner } = await warp.generateWallet());

    initialState = {
      owner,
      evolve: '',
      servers: {},
    };

    contractSrc = fs.readFileSync(path.join(__dirname, '../dist/servers/serverContract.js'), 'utf8');

    ({ contractTxId: contractId } = await warp.deploy({
      wallet: ownerWallet,
      initState: JSON.stringify(initialState),
      src: contractSrc,
      evaluationManifest: {
        evaluationOptions: {
          useKVStorage: true,
        },
      },
    }));
    console.log('Deployed contract: ', contractId);
    contract = warp
      .contract<ContractState>(contractId)
      .connect(ownerWallet)
      .setEvaluationOptions({ useKVStorage: true });
  });

  afterAll(async () => {
    await arlocal.stop();
  });

  it('should properly deploy contract', async () => {
    const contractTx = await warp.arweave.transactions.get(contractId);

    expect(contractTx).not.toBeNull();
  });

  it('should read Contract state', async () => {
    console.log(initialState);
    console.log((await contract.readState()).cachedValue.state);
    expect((await contract.readState()).cachedValue.state).toEqual(initialState);
  });

  it('should not register server if contract tx id is not valid', async () => {
    await expect(
      contract.writeInteraction(
        { function: 'registerServer', serverId: '12334', serverName: 'serverName', contractTxId: '3523453' },
        { strict: true }
      )
    ).rejects.toThrow('Incorrect contract tx id.');
  });

  it('should correctly register a server', async () => {
    await contract.writeInteraction({
      function: 'registerServer',
      serverId: '12334',
      serverName: 'serverName',
      contractTxId: 'ynfQO52y6qLGDQ62l8KqbXDQFs_wDd6PU1CQf3Q4RYE',
    });

    const result = (
      await contract.viewState<{ function: string; serverId: string }, { serverName: string; contractTxId: string }>({
        function: 'getServerInfo',
        serverId: '12334',
      })
    ).result;
    expect(result.serverName).toEqual('serverName');
    expect(result.contractTxId).toEqual('ynfQO52y6qLGDQ62l8KqbXDQFs_wDd6PU1CQf3Q4RYE');
  });

  it('should not register name if registering same serverId again', async () => {
    await expect(
      contract.writeInteraction(
        {
          function: 'registerServer',
          serverId: '12334',
          serverName: 'serverName',
          contractTxId: 'ynfQO52y6qLGDQ62l8KqbXDQFs_wDd6PU1CQf3Q4RYE',
        },
        { strict: true }
      )
    ).rejects.toThrow('Server has been already registered.');
  });

  it('should not register server if serverId is not provided', async () => {
    await expect(
      contract.writeInteraction(
        {
          function: 'registerServer',
          serverName: 'serverName',
          contractTxId: 'ynfQO52y6qLGDQ62l8KqbXDQFs_wDd6PU1CQf3Q4RYE',
        },
        { strict: true }
      )
    ).rejects.toThrow('serverId should be provided.');
  });

  it('should not register server if serverName is not provided', async () => {
    await expect(
      contract.writeInteraction(
        {
          function: 'registerServer',
          serverId: '234234324',
          contractTxId: 'ynfQO52y6qLGDQ62l8KqbXDQFs_wDd6PU1CQf3Q4RYE',
        },
        { strict: true }
      )
    ).rejects.toThrow('serverName should be provided.');
  });

  it('should not register server if contract id is not provided', async () => {
    await expect(
      contract.writeInteraction(
        { function: 'registerServer', serverId: '234234324', serverName: 'randomServerName' },
        { strict: true }
      )
    ).rejects.toThrow('contractTxId should be provided.');
  });

  it('should remove server', async () => {
    await contract.writeInteraction({ function: 'removeServer', serverId: '12334' });

    const result = (
      await contract.viewState<{ function: string; serverId: string }, { serverName: string; contractTxId: string }>({
        function: 'getServerInfo',
        serverId: '12334',
      })
    ).result;
    expect(result.serverName).toEqual(undefined);
  });

  it('should throw when trying to remove non-existing server', async () => {
    await expect(
      contract.writeInteraction({ function: 'removeServer', serverId: '234234324' }, { strict: true })
    ).rejects.toThrow('Server not found.');
  });
});
