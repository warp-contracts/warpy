import ArLocal from 'arlocal';
import { JWKInterface } from 'arweave/node/lib/wallet';
import fs from 'fs';
import path from 'path';
import { DeployPlugin } from 'warp-contracts-plugin-deploy';
import { ContractState } from '../src/warpDiscordBot/types/types';
import { LoggerFactory, Warp, WarpFactory, Contract } from 'warp-contracts';
import { VRFPlugin } from 'warp-contracts-plugin-vrf';

jest.setTimeout(30000);

describe('Testing warpDiscordBot contract - add points with cap', () => {
  let ownerWallet: JWKInterface;
  let owner: string;

  let ownerWallet2: JWKInterface;
  let owner2: string;

  let ownerWallet3: JWKInterface;
  let owner3: string;

  let initialState: ContractState;

  let arlocal: ArLocal;
  let warp: Warp;
  let contract: Contract<ContractState>;

  let contractSrc: string;

  let contractId: string;

  let currentTimestamp: number;

  beforeAll(async () => {
    arlocal = new ArLocal(1823, false);
    await arlocal.start();

    LoggerFactory.INST.logLevel('info');

    warp = WarpFactory.forLocal(1823).use(new DeployPlugin()).use(new VRFPlugin());

    ({ jwk: ownerWallet, address: owner } = await warp.generateWallet());
    ({ jwk: ownerWallet2, address: owner2 } = await warp.generateWallet());
    ({ jwk: ownerWallet3, address: owner3 } = await warp.generateWallet());

    currentTimestamp = Date.now();
    initialState = {
      owners: [owner],
      serverName: 'TEST_SERVER',
      creationTimestamp: currentTimestamp,
      ticker: 'TEST_SERVER_TICKER',
      name: 'Test Server',
      messagesTokenWeight: 100,
      reactionsTokenWeight: 10,
      balances: {},
      users: {},
      messages: {},
      boosts: {},
      admins: ['asia'],
      seasons: {},
      reactions: {
        max: 5,
        timeLagInSeconds: 50,
      },
      rouletteEntry: 500,
      divisibility: 1000,
      rouletteOn: false,
      counter: {},
    };

    contractSrc = fs.readFileSync(path.join(__dirname, '../dist/warpDiscordBot/warpDiscordBotContract.js'), 'utf8');

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
    expect((await contract.readState()).cachedValue.state).toEqual(initialState);
  });

  it('should correctly register user', async () => {
    await contract.writeInteraction({ function: 'registerUser', id: 'asia', address: owner });
    await contract.writeInteraction({ function: 'registerUser', id: 'asd', address: owner2 });
    await contract.writeInteraction({ function: 'registerUser', id: 'tomek', address: owner3 });

    const address = (
      await contract.viewState<{ function: string; id: string }, { address: string }>({
        function: 'getAddress',
        id: 'asia',
      })
    ).result.address;
    expect(address).toEqual(owner);

    const address2 = (
      await contract.viewState<{ function: string; id: string }, { address: string }>({
        function: 'getAddress',
        id: 'asd',
      })
    ).result.address;
    expect(address2).toEqual(owner2);

    const address3 = (
      await contract.viewState<{ function: string; id: string }, { address: string }>({
        function: 'getAddress',
        id: 'tomek',
      })
    ).result.address;
    expect(address3).toEqual(owner3);
  });

  // it('should correctly add temporary balances', async () => {
  //   const addPointsInput = {
  //     function: 'addPointsWithCap',
  //     points: 20,
  //     adminId: 'asia',
  //     members: [
  //       { id: owner, txId: 'testTxId', roles: [] },
  //       { id: owner2, txId: 'testTxId', roles: [], points: 11 },
  //       { id: owner3, txId: 'testTxId', roles: [], points: 5 },
  //     ],
  //   };
  //   await contract.writeInteraction(addPointsInput);
  //   const state = (await contract.readState()).cachedValue.state;
  //   const temporaryBalances = state.temporaryBalances;
  //   expect(temporaryBalances[owner].balance).toEqual(20);
  //   expect(temporaryBalances[owner].userId).toEqual('asia');
  //   expect(temporaryBalances[owner2].balance).toEqual(11);
  //   expect(temporaryBalances[owner2].userId).toEqual('asd');
  //   expect(temporaryBalances[owner3].balance).toEqual(5);
  //   expect(temporaryBalances[owner3].userId).toEqual('tomek');
  //   expect(state.temporaryTotalSum).toEqual(36);
  // });

  it('should correctly add balances', async () => {
    const addPointsInput = {
      function: 'addPointsWithCap',
      points: 20,
      adminId: 'asia',
      members: [
        { id: owner, txId: 'testTxId', roles: [] },
        { id: owner2, txId: 'testTxId', roles: [], points: 11 },
        { id: owner3, txId: 'testTxId', roles: [], points: 5 },
      ],
      cap: 50000,
    };
    await contract.writeInteraction(addPointsInput);
    const state = (await contract.readState()).cachedValue.state;
    const balances = state.balances;
    expect(balances[owner]).toEqual(27778);
    expect(balances[owner2]).toEqual(15278);
    expect(balances[owner3]).toEqual(6944);
    expect(state.temporaryTotalSum).toEqual(0);
    expect(Object.keys(state.temporaryBalances).length).toEqual(0);
  });

  it('should correctly add balances', async () => {
    const addPointsInput = {
      function: 'addPointsWithCap',
      points: 20,
      adminId: 'asia',
      members: [
        { id: owner, txId: 'testTxId2', roles: [] },
        { id: owner2, txId: 'testTxId2', roles: [], points: 11 },
        { id: owner3, txId: 'testTxId2', roles: [], points: 5 },
      ],
      cap: 50000,
    };
    await contract.writeInteraction(addPointsInput);
    const state = (await contract.readState()).cachedValue.state;
    const balances = state.balances;
    expect(balances[owner]).toEqual(27778);
    expect(balances[owner2]).toEqual(15278);
    expect(balances[owner3]).toEqual(6944);
    expect(state.temporaryTotalSum).toEqual(0);
    expect(Object.keys(state.temporaryBalances).length).toEqual(0);
  });
});
