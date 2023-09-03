import ArLocal from 'arlocal';
import { JWKInterface } from 'arweave/node/lib/wallet';
import fs from 'fs';
import path from 'path';
import { DeployPlugin } from 'warp-contracts-plugin-deploy';
import { ContractState } from '../src/warpDiscordBot/types/types';
import { LoggerFactory, Warp, WarpFactory, Contract } from 'warp-contracts';

jest.setTimeout(30000);

describe('Testing warpDiscordBot contract', () => {
  let ownerWallet: JWKInterface;
  let owner: string;

  let ownerWallet2: JWKInterface;
  let owner2: string;

  let initialState: ContractState;

  let arlocal: ArLocal;
  let warp: Warp;
  let contract: Contract<ContractState>;

  let contractSrc: string;

  let contractId: string;

  let currentTimestamp: number;

  beforeAll(async () => {
    arlocal = new ArLocal(1820, false);
    await arlocal.start();

    LoggerFactory.INST.logLevel('info');

    warp = WarpFactory.forLocal(1820).use(new DeployPlugin());

    ({ jwk: ownerWallet, address: owner } = await warp.generateWallet());
    ({ jwk: ownerWallet2, address: owner2 } = await warp.generateWallet());

    currentTimestamp = Date.now();
    initialState = {
      owner,
      serverName: 'TEST_SERVER',
      creationTimestamp: currentTimestamp,
      ticker: 'TEST_SERVER_TICKER',
      name: 'Test Server',
      messagesTokenWeight: 100,
      reactionsTokenWeight: 10,
      balances: {},
      users: {},
      counter: {},
      messages: {},
      boosts: {},
      admins: [],
      seasons: {},
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
    console.log(initialState);
    console.log((await contract.readState()).cachedValue.state);
    expect((await contract.readState()).cachedValue.state).toEqual(initialState);
  });

  it('should correctly register user', async () => {
    await contract.writeInteraction({ function: 'registerUser', id: 'asia', address: owner });

    const address = (
      await contract.viewState<{ function: string; id: string }, { address: string }>({
        function: 'getAddress',
        id: 'asia',
      })
    ).result.address;
    expect(address).toEqual(owner);
  });

  it('should not register user if registering same id again', async () => {
    await expect(
      contract.writeInteraction({ function: 'registerUser', id: 'asia', address: 'randomAddress' }, { strict: true })
    ).rejects.toThrow('Id already assigned.');
  });

  it('should not register id if id is not provided', async () => {
    await expect(
      contract.writeInteraction({ function: 'registerUser', address: 'randomAddress' }, { strict: true })
    ).rejects.toThrow('Id must be provided.');
  });

  it('should not register id if id is not provided', async () => {
    await expect(contract.writeInteraction({ function: 'registerUser', id: 'asia' }, { strict: true })).rejects.toThrow(
      'Address must be provided.'
    );
  });

  it('should not register id if registering same address again', async () => {
    await expect(
      contract.writeInteraction({ function: 'registerUser', id: 'randomName', address: owner }, { strict: true })
    ).rejects.toThrow('Address already assigned.');
  });

  it('should throw if id is not passed to the interaction', async () => {
    await expect(contract.writeInteraction({ function: 'getAddress' }, { strict: true })).rejects.toThrow(
      'Id must be provided.'
    );
  });

  it('should not return address if there is no id in the map', async () => {
    await expect(
      contract.writeInteraction({ function: 'getAddress', id: 'randomName' }, { strict: true })
    ).rejects.toThrow('Id has no address assigned.');
  });

  it('should not add admin if id is not provided', async () => {
    await expect(contract.writeInteraction({ function: 'addAdmin' }, { strict: true })).rejects.toThrow(
      `Admin's id should be provided.`
    );
  });

  it('should properly add admin', async () => {
    await contract.writeInteraction({ function: 'addAdmin', id: 'testAdmin' });
    await contract.writeInteraction({ function: 'addAdmin', id: 'testAdmin2' });

    const { cachedValue } = await contract.readState();
    expect(cachedValue.state.admins[0]).toBe('testAdmin');
    expect(cachedValue.state.admins[1]).toBe('testAdmin2');
  });

  it('should not add same admin id for the second time', async () => {
    await expect(
      contract.writeInteraction({ function: 'addAdmin', id: 'testAdmin' }, { strict: true })
    ).rejects.toThrow(`Admin's id already on the list.`);
  });

  it('should not remove admin if id is not provided', async () => {
    await expect(contract.writeInteraction({ function: 'removeAdmin' }, { strict: true })).rejects.toThrow(
      `Admin's id should be provided.`
    );
  });

  it('should throw when trying to remove non-existing admin', async () => {
    await expect(
      contract.writeInteraction({ function: 'removeAdmin', id: 'testAdmin3' }, { strict: true })
    ).rejects.toThrow(`Admin's not on the list.`);
  });

  it('should properly remove admin', async () => {
    await contract.writeInteraction({ function: 'removeAdmin', id: 'testAdmin2' });

    const { cachedValue } = await contract.readState();
    expect(cachedValue.state.admins.length).toEqual(1);
  });

  it('should not add message with no content', async () => {
    await expect(
      contract.writeInteraction({ function: 'addMessage', id: 'asia', messageId: '1' }, { strict: true })
    ).rejects.toThrow('No content provided.');
  });

  it('should not add message with no id', async () => {
    await expect(
      contract.writeInteraction({ function: 'addMessage', content: 'randomContent', messageId: '1' }, { strict: true })
    ).rejects.toThrow(`Caller's id should be provided.`);
  });

  it('should not add message with no messageId', async () => {
    await expect(
      contract.writeInteraction({ function: 'addMessage', content: 'randomContent', id: 'asia' }, { strict: true })
    ).rejects.toThrow(`Message id should be provided.`);
  });

  it('should properly add message', async () => {
    await contract.writeInteraction({ function: 'addMessage', id: 'asia', content: 'randomContent', messageId: '1' });
    const counter = (
      await contract.viewState<
        { function: string; id: string },
        { counter: { messages: number; reactions: number; points: number } }
      >({
        function: 'getCounter',
        id: 'asia',
      })
    ).result?.counter;
    expect(counter.messages).toEqual(1);
    expect(counter.points).toEqual(100);
  });

  it('should properly add second message', async () => {
    await contract.writeInteraction({ function: 'addMessage', id: 'asia', messageId: '2', content: 'randomContent' });
    const counter = (
      await contract.viewState<
        { function: string; id: string },
        { counter: { messages: number; reactions: number; points: number } }
      >({
        function: 'getCounter',
        id: 'asia',
      })
    ).result?.counter;
    expect(counter.messages).toEqual(2);
    expect(counter.points).toEqual(200);
  });

  it('should properly add second user message', async () => {
    await contract.writeInteraction({ function: 'addMessage', id: 'tomek', content: 'randomContent', messageId: '3' });
    const counter = (
      await contract.viewState<
        { function: string; id: string },
        { counter: { messages: number; reactions: number; points: number } }
      >({
        function: 'getCounter',
        id: 'tomek',
      })
    ).result?.counter;
    expect(counter.messages).toEqual(1);
    expect(counter.points).toEqual(100);
  });

  it('should properly add reaction', async () => {
    await contract.writeInteraction({ function: 'addReaction', id: 'asia' });
    const counter = (
      await contract.viewState<
        { function: string; id: string },
        { counter: { messages: number; reactions: number; points: number } }
      >({
        function: 'getCounter',
        id: 'asia',
      })
    ).result?.counter;
    expect(counter.reactions).toEqual(1);
    expect(counter.messages).toEqual(2);
    expect(counter.points).toEqual(210);
  });

  it('should correctly set tokens when adding a message and a reaction', async () => {
    const result = await contract.viewState<
      { function: string; target: string },
      { target: string; ticker: string; balance: number }
    >({ function: 'balance', target: owner });
    expect(result.result.balance).toEqual(210);
  });

  it('should not allow to mint tokens if id is not registered in the name service', async () => {
    await expect(contract.writeInteraction({ function: 'mint', id: 'randomName' }, { strict: true })).rejects.toThrow(
      `User is not registered in the name service.`
    );
  });

  it('should mint tokens', async () => {
    await contract.writeInteraction({ function: 'registerUser', id: 'tomek', address: owner2 });
    await contract.writeInteraction({ function: 'mint', id: 'tomek' });

    const balance = (
      await contract.viewState<
        { function: string; target: string },
        { target: string; ticker: string; balance: number }
      >({ function: 'balance', target: owner2 })
    ).result?.balance;

    expect(balance).toEqual(100);
  });

  it('should correctly transfer tokens', async () => {
    await contract.writeInteraction({ function: 'transfer', target: owner2, qty: 100 });

    const balance = (
      await contract.viewState<
        { function: string; target: string },
        { target: string; ticker: string; balance: number }
      >({ function: 'balance', target: owner2 })
    ).result?.balance;

    expect(balance).toEqual(200);
  });

  it('should properly remove message', async () => {
    await contract.writeInteraction({ function: 'removeMessage', id: 'asia', messageId: '1' });

    const balance = (
      await contract.viewState<
        { function: string; target: string },
        { target: string; ticker: string; balance: number }
      >({ function: 'balance', target: owner })
    ).result?.balance;

    expect(balance).toEqual(10);

    const counter = (
      await contract.viewState<
        { function: string; id: string },
        { counter: { messages: number; reactions: number; points: number } }
      >({
        function: 'getCounter',
        id: 'asia',
      })
    ).result?.counter;
    expect(counter.messages).toEqual(1);
    expect(counter.points).toEqual(110);
  });

  it('should properly remove reaction', async () => {
    await contract.writeInteraction({ function: 'removeReaction', id: 'asia' });

    const balance = (
      await contract.viewState<
        { function: string; target: string },
        { target: string; ticker: string; balance: number }
      >({ function: 'balance', target: owner })
    ).result?.balance;

    expect(balance).toEqual(0);

    const counter = (
      await contract.viewState<
        { function: string; id: string },
        { counter: { messages: number; reactions: number; points: number } }
      >({
        function: 'getCounter',
        id: 'asia',
      })
    ).result?.counter;
    expect(counter.reactions).toEqual(0);
    expect(counter.points).toEqual(100);
  });

  it('should throw when trying to delet non-existing message', async () => {
    await expect(
      contract.writeInteraction({ function: 'removeMessage', id: 'asia', messageId: '99' }, { strict: true })
    ).rejects.toThrow(`Message not found.`);
  });

  it('should not allow to add boost when name is not provided', async () => {
    await expect(contract.writeInteraction({ function: 'addBoost', value: 5 }, { strict: true })).rejects.toThrow(
      `Boost name should be provided.`
    );
  });

  it('should not allow to add boost when value is not provided', async () => {
    await expect(
      contract.writeInteraction({ function: 'addBoost', name: 'testBoost' }, { strict: true })
    ).rejects.toThrow(`Boost value should be provided.`);
  });

  it(`should not allow to add boost when name is not of type 'string'`, async () => {
    await expect(
      contract.writeInteraction({ function: 'addBoost', name: 30, value: 5 }, { strict: true })
    ).rejects.toThrow(`Boost name should be of type 'string'.`);
  });

  it(`should not allow to add boost when value is not of type 'number'`, async () => {
    await expect(
      contract.writeInteraction({ function: 'addBoost', name: 'testBoost', value: 'testBoostValue' }, { strict: true })
    ).rejects.toThrow(`Boost value should be of type 'number'.`);
  });

  it('should correctly add boost', async () => {
    await contract.writeInteraction({ function: 'addBoost', name: 'testBoost', value: 3 });

    const boost = (
      await contract.viewState<{ function: string; name: string }, { boost: number }>({
        function: 'getBoost',
        name: 'testBoost',
      })
    ).result?.boost;

    expect(boost).toBe(3);
  });

  it(`should not allow to add boost with the same name twice`, async () => {
    await expect(
      contract.writeInteraction({ function: 'addBoost', name: 'testBoost', value: 5 }, { strict: true })
    ).rejects.toThrow(`Boost with given name already exists.`);
  });

  it('should not allow to remove boost if no name is given', async () => {
    await expect(contract.writeInteraction({ function: 'removeBoost' }, { strict: true })).rejects.toThrow(
      `Boost name should be provided.`
    );
  });

  it(`should not allow to remove boost if boost name is of type 'string'`, async () => {
    await expect(contract.writeInteraction({ function: 'removeBoost', name: 5 }, { strict: true })).rejects.toThrow(
      `Boost name should be of type 'string'.`
    );
  });

  it(`should not allow to remove boost if boost name is of type 'string'`, async () => {
    await expect(
      contract.writeInteraction({ function: 'removeBoost', name: 'incorrectTestBoost' }, { strict: true })
    ).rejects.toThrow(`Boost with given name does not exist.`);
  });

  it('should remove boost correctly', async () => {
    await contract.writeInteraction({ function: 'removeBoost', name: 'testBoost' });

    const boost = (
      await contract.viewState<{ function: string; name: string }, { boost: number }>({
        function: 'getBoost',
        name: 'testBoost',
      })
    ).result?.boost;

    expect(boost).toBe(0);
  });

  it('should not allow to change boost when name is not provided', async () => {
    await expect(contract.writeInteraction({ function: 'changeBoost', value: 15 }, { strict: true })).rejects.toThrow(
      `Boost name should be provided.`
    );
  });

  it('should not allow to change boost when value is not provided', async () => {
    await expect(
      contract.writeInteraction({ function: 'changeBoost', name: 'testChangeBoost' }, { strict: true })
    ).rejects.toThrow(`Boost value should be provided.`);
  });

  it(`should not allow to change boost when name is not of type 'string'`, async () => {
    await expect(
      contract.writeInteraction({ function: 'changeBoost', name: 20, value: 6 }, { strict: true })
    ).rejects.toThrow(`Boost name should be of type 'string'.`);
  });

  it(`should not allow to change boost when value is not of type 'number'`, async () => {
    await expect(
      contract.writeInteraction(
        { function: 'changeBoost', name: 'testChangeBoost', value: 'testChangeBoostValue' },
        { strict: true }
      )
    ).rejects.toThrow(`Boost value should be of type 'number'.`);
  });

  it('should correctly change boost', async () => {
    await contract.writeInteraction({ function: 'addBoost', name: 'testChangeBoost', value: 3 });
    await contract.writeInteraction({ function: 'changeBoost', name: 'testChangeBoost', value: 6 });

    const boost = (
      await contract.viewState<{ function: string; name: string }, { boost: number }>({
        function: 'getBoost',
        name: 'testChangeBoost',
      })
    ).result?.boost;

    expect(boost).toBe(6);
  });

  it(`should not allow to change boost when boost does not exist`, async () => {
    await expect(
      contract.writeInteraction(
        { function: 'changeBoost', name: 'incorrectTestChangeBoost', value: 7 },
        { strict: true }
      )
    ).rejects.toThrow(`Boost with given name does not exist.`);
  });

  it('should not allow to add user boost when name is not provided', async () => {
    await expect(contract.writeInteraction({ function: 'addUserBoost', id: 'asia' }, { strict: true })).rejects.toThrow(
      `Boost name should be provided.`
    );
  });

  it('should not allow to add user boost when user id is not provided', async () => {
    await expect(
      contract.writeInteraction({ function: 'addUserBoost', name: 'testChangeBoost' }, { strict: true })
    ).rejects.toThrow(`User id should be provided.`);
  });

  it(`should not allow to add user boost when name is not of type 'string'`, async () => {
    await expect(
      contract.writeInteraction({ function: 'addUserBoost', name: 5, id: 'asia' }, { strict: true })
    ).rejects.toThrow(`Boost name should be of type 'string'.`);
  });

  it(`should not allow to change boost when user id is not of type 'string'`, async () => {
    await expect(
      contract.writeInteraction({ function: 'addUserBoost', name: 'testChangeBoost', id: 5 }, { strict: true })
    ).rejects.toThrow(`User id should be of type 'string'.`);
  });

  it('should correctly add user boost', async () => {
    await contract.writeInteraction({ function: 'addUserBoost', name: 'testChangeBoost', id: 'asia' });

    const counter = (
      await contract.viewState<
        { function: string; id: string },
        { counter: { messages: number; reactions: number; points: number; boosts: string[] } }
      >({
        function: 'getCounter',
        id: 'asia',
      })
    ).result?.counter;
    expect(counter.boosts.length).toEqual(1);
  });

  it('should not allow to remove user boost when name is not provided', async () => {
    await expect(
      contract.writeInteraction({ function: 'removeUserBoost', id: 'asia' }, { strict: true })
    ).rejects.toThrow(`Boost name should be provided.`);
  });

  it('should not allow to remove user boost when user id is not provided', async () => {
    await expect(
      contract.writeInteraction({ function: 'removeUserBoost', name: 'testChangeBoost' }, { strict: true })
    ).rejects.toThrow(`User id should be provided.`);
  });

  it(`should not allow to add user boost when name is not of type 'string'`, async () => {
    await expect(
      contract.writeInteraction({ function: 'addUserBoost', name: 5, id: 'asia' }, { strict: true })
    ).rejects.toThrow(`Boost name should be of type 'string'.`);
  });

  it(`should not allow to change boost when user id is not of type 'string'`, async () => {
    await expect(
      contract.writeInteraction({ function: 'addUserBoost', name: 'testChangeBoost', id: 5 }, { strict: true })
    ).rejects.toThrow(`User id should be of type 'string'.`);
  });

  it(`should not allow to remove boost when boost is not assigned to user`, async () => {
    await expect(
      contract.writeInteraction(
        { function: 'removeUserBoost', name: 'incorrectTestChangeBoost', id: 'asia' },
        { strict: true }
      )
    ).rejects.toThrow(`Boost not found.`);
  });

  it('should correctly remove user boost', async () => {
    await contract.writeInteraction({ function: 'removeUserBoost', name: 'testChangeBoost', id: 'asia' });
    const counter = (
      await contract.viewState<
        { function: string; id: string },
        { counter: { messages: number; reactions: number; boosts: string[] } }
      >({
        function: 'getCounter',
        id: 'asia',
      })
    ).result?.counter;

    expect(counter.boosts.length).toBe(0);
    const { cachedValue } = await contract.readState();
    console.log(cachedValue.state);
  });

  it('should correctly calculate points based on boost - message', async () => {
    await contract.writeInteraction({ function: 'addUserBoost', name: 'testChangeBoost', id: 'asia' });
    await contract.writeInteraction({ function: 'addMessage', id: 'asia', content: 'randomContent', messageId: '66' });

    const counter = (
      await contract.viewState<
        { function: string; id: string },
        { counter: { messages: number; reactions: number; boosts: string[]; points: number } }
      >({
        function: 'getCounter',
        id: 'asia',
      })
    ).result?.counter;

    expect(counter.points).toEqual(700);

    const result = await contract.viewState<
      { function: string; target: string },
      { target: string; ticker: string; balance: number }
    >({ function: 'balance', target: owner });
    expect(result.result.balance).toEqual(600);
  });

  it('should correctly calculate points based on boost - reaction', async () => {
    await contract.writeInteraction({ function: 'addReaction', id: 'asia' });

    const counter = (
      await contract.viewState<
        { function: string; id: string },
        { counter: { messages: number; reactions: number; boosts: string[]; points: number } }
      >({
        function: 'getCounter',
        id: 'asia',
      })
    ).result?.counter;

    expect(counter.points).toEqual(760);

    const result = await contract.viewState<
      { function: string; target: string },
      { target: string; ticker: string; balance: number }
    >({ function: 'balance', target: owner });
    expect(result.result.balance).toEqual(660);
  });

  it('should properly remove message', async () => {
    await contract.writeInteraction({ function: 'removeMessage', id: 'asia', messageId: '66' });

    const balance = (
      await contract.viewState<
        { function: string; target: string },
        { target: string; ticker: string; balance: number }
      >({ function: 'balance', target: owner })
    ).result?.balance;

    expect(balance).toEqual(60);

    const counter = (
      await contract.viewState<
        { function: string; id: string },
        { counter: { messages: number; reactions: number; points: number } }
      >({
        function: 'getCounter',
        id: 'asia',
      })
    ).result?.counter;
    expect(counter.messages).toEqual(1);
    expect(counter.points).toEqual(160);
  });

  it('should properly remove reaction', async () => {
    await contract.writeInteraction({ function: 'removeReaction', id: 'asia' });

    const balance = (
      await contract.viewState<
        { function: string; target: string },
        { target: string; ticker: string; balance: number }
      >({ function: 'balance', target: owner })
    ).result?.balance;

    expect(balance).toEqual(0);

    const counter = (
      await contract.viewState<
        { function: string; id: string },
        { counter: { messages: number; reactions: number; points: number } }
      >({
        function: 'getCounter',
        id: 'asia',
      })
    ).result?.counter;
    expect(counter.reactions).toEqual(0);
    expect(counter.points).toEqual(100);
  });

  it('should properly add second boost and calculate points and balance based on it', async () => {
    await contract.writeInteraction({ function: 'addBoost', name: 'secondTestBoost', value: 3 });
    await contract.writeInteraction({ function: 'addUserBoost', name: 'secondTestBoost', id: 'asia' });
    await contract.writeInteraction({ function: 'addReaction', id: 'asia' });
    await contract.writeInteraction({ function: 'addMessage', id: 'asia', content: 'randomContent', messageId: '77' });

    const balance = (
      await contract.viewState<
        { function: string; target: string },
        { target: string; ticker: string; balance: number }
      >({ function: 'balance', target: owner })
    ).result?.balance;

    expect(balance).toEqual(180 + 1800);
    const counter = (
      await contract.viewState<
        { function: string; id: string },
        { counter: { messages: number; reactions: number; points: number } }
      >({
        function: 'getCounter',
        id: 'asia',
      })
    ).result?.counter;
    expect(counter.points).toEqual(100 + 180 + 1800);
  });

  it(`should not allow to add points when id is not provided`, async () => {
    await expect(
      contract.writeInteraction({ function: 'addPoints', points: 5, adminId: 'testAdmin' }, { strict: true })
    ).rejects.toThrow(`User's id should be provided.`);
  });

  it(`should not allow to add points when points are not provided`, async () => {
    await expect(
      contract.writeInteraction({ function: 'addPoints', id: 'asia', adminId: 'testAdmin' }, { strict: true })
    ).rejects.toThrow(`Points should be provided.`);
  });

  it(`should not allow to add points when adminId is not provided`, async () => {
    await expect(
      contract.writeInteraction({ function: 'addPoints', id: 'asia', points: 5 }, { strict: true })
    ).rejects.toThrow(`Caller's id should be provided.`);
  });

  it(`should not allow to add points when adminId is not on admins list`, async () => {
    await expect(
      contract.writeInteraction(
        { function: 'addPoints', id: 'asia', points: 5, adminId: 'incorrectTestAdmin' },
        { strict: true }
      )
    ).rejects.toThrow(`Only admin can award points.`);
  });

  it('should correctly award points', async () => {
    await contract.writeInteraction({ function: 'addPoints', id: 'asia', points: 5, adminId: 'testAdmin' });

    const balance = (
      await contract.viewState<
        { function: string; target: string },
        { target: string; ticker: string; balance: number }
      >({ function: 'balance', target: owner })
    ).result?.balance;

    // boost - 18, points: 5
    expect(balance).toEqual(180 + 1800 + 18 * 5);
    const counter = (
      await contract.viewState<
        { function: string; id: string },
        { counter: { messages: number; reactions: number; points: number } }
      >({
        function: 'getCounter',
        id: 'asia',
      })
    ).result?.counter;
    expect(counter.points).toEqual(100 + 180 + 1800 + 18 * 5);
  });

  it(`should not allow to remove points when id is not provided`, async () => {
    await expect(
      contract.writeInteraction({ function: 'removePoints', points: 5, adminId: 'testAdmin' }, { strict: true })
    ).rejects.toThrow(`User's id should be provided.`);
  });

  it(`should not allow to remove points when points are not provided`, async () => {
    await expect(
      contract.writeInteraction({ function: 'removePoints', id: 'asia', adminId: 'testAdmin' }, { strict: true })
    ).rejects.toThrow(`Points should be provided.`);
  });

  it(`should not allow to remove points when adminId is not provided`, async () => {
    await expect(
      contract.writeInteraction({ function: 'removePoints', id: 'asia', points: 5 }, { strict: true })
    ).rejects.toThrow(`Caller's id should be provided.`);
  });

  it(`should not allow to remove points when adminId is not on admins list`, async () => {
    await expect(
      contract.writeInteraction(
        { function: 'removePoints', id: 'asia', points: 5, adminId: 'incorrectTestAdmin' },
        { strict: true }
      )
    ).rejects.toThrow(`Only admin can remove points.`);
  });

  it('should correctly remove points', async () => {
    await contract.writeInteraction({ function: 'removePoints', id: 'asia', points: 5, adminId: 'testAdmin' });

    const balance = (
      await contract.viewState<
        { function: string; target: string },
        { target: string; ticker: string; balance: number }
      >({ function: 'balance', target: owner })
    ).result?.balance;

    expect(balance).toEqual(180 + 1800);
    const counter = (
      await contract.viewState<
        { function: string; id: string },
        { counter: { messages: number; reactions: number; points: number } }
      >({
        function: 'getCounter',
        id: 'asia',
      })
    ).result?.counter;
    expect(counter.points).toEqual(100 + 180 + 1800);
  });

  it(`should not allow to add season when name is not provided`, async () => {
    await expect(
      contract.writeInteraction(
        { function: 'addSeason', from: '123456', to: '654321', boost: 'seasonBoost' },
        { strict: true }
      )
    ).rejects.toThrow(`Season name should be provided.`);
  });

  it(`should not allow to add season when from timestamp is not provided`, async () => {
    await expect(
      contract.writeInteraction(
        { function: 'addSeason', name: 'seasonName', to: '654321', boost: 'seasonBoost' },
        { strict: true }
      )
    ).rejects.toThrow(`From timestamp should be provided.`);
  });

  it(`should not allow to add season when to timestamp is not provided`, async () => {
    await expect(
      contract.writeInteraction(
        { function: 'addSeason', name: 'seasonName', from: '123456', boost: 'seasonBoost' },
        { strict: true }
      )
    ).rejects.toThrow(`To timestamp should be provided.`);
  });

  it(`should not allow to add season when boost is not provided`, async () => {
    await expect(
      contract.writeInteraction(
        { function: 'addSeason', name: 'seasonName', from: '123456', to: '654321' },
        { strict: true }
      )
    ).rejects.toThrow(`Boost name should be provided.`);
  });

  it(`should not allow to add season when boost is not on the list`, async () => {
    await expect(
      contract.writeInteraction(
        { function: 'addSeason', name: 'seasonName', from: '123456', to: '654321', boost: 'nonExistingBoost' },
        { strict: true }
      )
    ).rejects.toThrow(`Boost with given name does not exist. Please add boost first.`);
  });

  it('should properly add season', async () => {
    await contract.writeInteraction({ function: 'addBoost', name: 'seasonBoost', value: 2 });
    await contract.writeInteraction({
      function: 'addSeason',
      name: 'seasonName',
      from: '123456',
      to: '654321',
      boost: 'seasonBoost',
    });

    const { cachedValue } = await contract.readState();
    expect(JSON.stringify(cachedValue.state.seasons['seasonName'])).toBe(
      JSON.stringify({ from: '123456', to: '654321', boost: 'seasonBoost' })
    );
  });

  it('should add message points according to season boost', async () => {
    await contract.writeInteraction({
      function: 'addSeason',
      name: 'seasonName2',
      from: Math.round((currentTimestamp - 9000) / 1000),
      to: Math.round((currentTimestamp + 9000) / 1000),
      boost: 'seasonBoost',
    });
    await contract.writeInteraction({ function: 'addMessage', id: 'asia', messageId: '55', content: 'randomContent' });

    const balance = (
      await contract.viewState<
        { function: string; target: string },
        { target: string; ticker: string; balance: number }
      >({ function: 'balance', target: owner })
    ).result?.balance;

    expect(balance).toEqual(180 + 1800 + 3600);
    const counter = (
      await contract.viewState<
        { function: string; id: string },
        { counter: { messages: number; reactions: number; points: number } }
      >({
        function: 'getCounter',
        id: 'asia',
      })
    ).result?.counter;
    expect(counter.points).toEqual(100 + 180 + 1800 + 3600);
  });

  it('should add reaction points according to season boost', async () => {
    await contract.writeInteraction({ function: 'addReaction', id: 'asia' });

    const { cachedValue } = await contract.readState();
    console.log('Cached value', cachedValue.state['counter']['asia']);
    console.log('Cached value', cachedValue.state['boosts']);

    const balance = (
      await contract.viewState<
        { function: string; target: string },
        { target: string; ticker: string; balance: number }
      >({ function: 'balance', target: owner })
    ).result?.balance;

    expect(balance).toEqual(180 + 1800 + 3600 + 360);
    const counter = (
      await contract.viewState<
        { function: string; id: string },
        { counter: { messages: number; reactions: number; points: number } }
      >({
        function: 'getCounter',
        id: 'asia',
      })
    ).result?.counter;
    expect(counter.points).toEqual(100 + 180 + 1800 + 3600 + 360);
  });
});
