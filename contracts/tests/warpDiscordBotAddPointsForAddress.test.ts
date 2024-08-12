import ArLocal from 'arlocal';
import { JWKInterface } from 'arweave/node/lib/wallet';
import fs from 'fs';
import path from 'path';
import { DeployPlugin } from 'warp-contracts-plugin-deploy';
import { ContractState } from '../src/warpDiscordBot/types/types';
import { LoggerFactory, Warp, WarpFactory, Contract } from 'warp-contracts';
import { VRFPlugin } from 'warp-contracts-plugin-vrf';

jest.setTimeout(30000);

describe('Testing warpDiscordBot contract - add points for address', () => {
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
    arlocal = new ArLocal(1822, false);
    await arlocal.start();

    LoggerFactory.INST.logLevel('info');

    warp = WarpFactory.forLocal(1822).use(new DeployPlugin()).use(new VRFPlugin());

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

  it('should correctly set messages limit', async () => {
    await contract.writeInteraction({
      function: 'setMessagesLimit',
      messagesLimit: {
        max: 10,
        timeLagInSeconds: 50,
      },
      adminId: 'asia',
    });

    const { cachedValue } = await contract.readState();
    expect(cachedValue.state.messagesLimit.max).toBe(10);
    expect(cachedValue.state.messagesLimit.timeLagInSeconds).toBe(50);
  });

  it('should correctly register user', async () => {
    await contract.writeInteraction({ function: 'registerUser', id: 'asia', address: owner });
    await contract.writeInteraction({ function: 'registerUser', id: 'asd', address: owner2 });

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
  });

  it('should correctly add points csv', async () => {
    const chunkSize = 5;

    const { cachedValue: cachedValue1 } = await contract.readState();

    console.log(cachedValue1.state.balances);
    const addresses = [
      { 'token id': 19007569, address: owner },
      { 'token id': 19007569, address: owner2, points: 90 },
    ];
    for (let i = 0; i < addresses.length; i += chunkSize) {
      const chunk = addresses.slice(i, i + chunkSize);

      let members;
      members = chunk.map((c) => {
        return {
          id: c.address,
          roles: [],
          points: c.points,
        };
      });

      console.log(members);

      const addPointsInput = {
        function: 'addPointsForAddress',
        points: 20,
        adminId: 'asia',
        members,
      };
      await contract.writeInteraction(addPointsInput);
    }
    const { cachedValue } = await contract.readState();

    expect(cachedValue.state.balances).toBeTruthy();
  });

  it('should correctly add points for address with on-chain txId', async () => {
    const addPointsInput = {
      function: 'addPointsForAddress',
      points: 20,
      adminId: 'asia',
      members: [
        { id: owner, txId: 'testTxId', roles: [] },
        { id: owner2, txId: 'testTxId', roles: [], points: 11 },
      ],
    };
    await contract.writeInteraction(addPointsInput);
    const balance = (
      await contract.viewState<
        { function: string; target: string },
        { target: string; ticker: string; balance: number }
      >({ function: 'balance', target: owner })
    ).result?.balance;

    expect(balance).toEqual(40);
  });

  it('should not add additional points for already registered transaction', async () => {
    const addPointsInput = {
      function: 'addPointsForAddress',
      points: 20,
      adminId: 'asia',
      members: [
        { id: owner, points: 20, txId: 'testTxId', roles: [] },
        { id: 'asd', points: 120, txId: 'testTxId', roles: [] },
      ],
    };
    await contract.writeInteraction(addPointsInput);
    const balance = (
      await contract.viewState<
        { function: string; target: string },
        { target: string; ticker: string; balance: number }
      >({ function: 'balance', target: owner })
    ).result?.balance;

    expect(balance).toEqual(40);
    const balance2 = (
      await contract.viewState<
        { function: string; target: string },
        { target: string; ticker: string; balance: number }
      >({ function: 'balance', target: owner2 })
    ).result?.balance;

    expect(balance2).toEqual(101);
  });
});
