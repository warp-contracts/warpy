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
      owners: [owner],
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
      admins: ['asia'],
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
    ).rejects.toThrow('id should be provided.');
  });

  it('should not register id if id is not provided', async () => {
    await expect(contract.writeInteraction({ function: 'registerUser', id: 'asia' }, { strict: true })).rejects.toThrow(
      'address should be provided.'
    );
  });

  it('should not register id if registering same address again', async () => {
    await expect(
      contract.writeInteraction({ function: 'registerUser', id: 'randomName', address: owner }, { strict: true })
    ).rejects.toThrow('Address already assigned.');
  });

  it('should throw if id is not passed to the interaction', async () => {
    await expect(contract.writeInteraction({ function: 'getAddress' }, { strict: true })).rejects.toThrow(
      'id should be provided.'
    );
  });

  it('should not return address if there is no id in the map', async () => {
    await expect(
      contract.writeInteraction({ function: 'getAddress', id: 'randomName' }, { strict: true })
    ).rejects.toThrow('Id has no address assigned.');
  });

  it('should not add admin if id is not provided', async () => {
    await expect(
      contract.writeInteraction({ function: 'addAdmin', adminId: 'asia' }, { strict: true })
    ).rejects.toThrow(`userId should be provided.`);
  });

  it('should not add admin if adminId is not provided', async () => {
    await expect(
      contract.writeInteraction({ function: 'addAdmin', userId: 'testAdmin' }, { strict: true })
    ).rejects.toThrow(`adminId should be provided.`);
  });

  it('should not add admin if adminId not on admins list', async () => {
    await expect(
      contract.writeInteraction({ function: 'addAdmin', adminId: 'tomek', userId: 'testAdmin' }, { strict: true })
    ).rejects.toThrow(`Only admin can add admins.`);
  });

  it('should properly add admin', async () => {
    await contract.writeInteraction({ function: 'addAdmin', userId: 'testAdmin', adminId: 'asia' });
    await contract.writeInteraction({ function: 'addAdmin', userId: 'testAdmin2', adminId: 'asia' });

    const { cachedValue } = await contract.readState();
    expect(cachedValue.state.admins[1]).toBe('testAdmin');
    expect(cachedValue.state.admins[2]).toBe('testAdmin2');
  });

  it('should not add same admin id for the second time', async () => {
    await expect(
      contract.writeInteraction({ function: 'addAdmin', userId: 'testAdmin', adminId: 'asia' }, { strict: true })
    ).rejects.toThrow(`Admin's id already on the list.`);
  });

  it('should not remove admin if userId is not provided', async () => {
    await expect(
      contract.writeInteraction({ function: 'removeAdmin', adminId: 'asia' }, { strict: true })
    ).rejects.toThrow(`userId should be provided.`);
  });

  it('should not remove admin if adminId is not provided', async () => {
    await expect(
      contract.writeInteraction({ function: 'removeAdmin', userId: 'testAdmin3' }, { strict: true })
    ).rejects.toThrow(`adminId should be provided.`);
  });

  it('should not remove admin if adminId not on admins list', async () => {
    await expect(
      contract.writeInteraction({ function: 'removeAdmin', adminId: 'tomek', userId: 'testAdmin3' }, { strict: true })
    ).rejects.toThrow(`Only admin can remove admins.`);
  });

  it('should throw when trying to remove non-existing admin', async () => {
    await expect(
      contract.writeInteraction({ function: 'removeAdmin', adminId: 'asia', userId: 'testAdmin3' }, { strict: true })
    ).rejects.toThrow(`Admin's not on the list.`);
  });

  it('should properly remove admin', async () => {
    await contract.writeInteraction({ function: 'removeAdmin', userId: 'testAdmin2', adminId: 'asia' });

    const { cachedValue } = await contract.readState();
    expect(cachedValue.state.admins.length).toEqual(2);
  });

  it('should not add message with no content', async () => {
    await expect(
      contract.writeInteraction(
        { function: 'addMessage', id: 'asia', messageId: '1', roles: ['admin'] },
        { strict: true }
      )
    ).rejects.toThrow('content should be provided.');
  });

  it('should not add message with no id', async () => {
    await expect(
      contract.writeInteraction(
        { function: 'addMessage', content: 'randomContent', messageId: '1', roles: ['admin'] },
        { strict: true }
      )
    ).rejects.toThrow(`id should be provided.`);
  });

  it('should not add message with no messageId', async () => {
    await expect(
      contract.writeInteraction(
        { function: 'addMessage', content: 'randomContent', id: 'asia', roles: ['admin'] },
        { strict: true }
      )
    ).rejects.toThrow(`messageId should be provided.`);
  });

  it('should properly add message', async () => {
    await contract.writeInteraction({
      function: 'addMessage',
      id: 'asia',
      content: 'randomContent',
      messageId: '1',
      roles: ['admin'],
    });
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
    await contract.writeInteraction({
      function: 'addMessage',
      id: 'asia',
      messageId: '2',
      content: 'randomContent',
      roles: ['admin'],
    });
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
    await contract.writeInteraction({
      function: 'addMessage',
      id: 'tomek',
      content: 'randomContent',
      messageId: '3',
      roles: ['admin'],
    });
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
    await contract.writeInteraction({
      function: 'addReaction',
      userId: 'asia',
      messageId: '123',
      emoji: 'hearthpulse',
      roles: ['admin'],
    });
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
    await contract.writeInteraction({ function: 'removeMessage', userId: 'asia', messageId: '1' });

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
    await contract.writeInteraction({
      function: 'removeReaction',
      userId: 'asia',
      messageId: '123',
      emoji: 'hearthpulse',
    });

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
      contract.writeInteraction(
        { function: 'removeMessage', userId: 'asia', messageId: '99', adminId: 'asia' },
        { strict: true }
      )
    ).rejects.toThrow(`Message not found.`);
  });

  it('should not allow to add boost when name is not provided', async () => {
    await expect(
      contract.writeInteraction({ function: 'addBoost', value: 5, adminId: 'asia' }, { strict: true })
    ).rejects.toThrow(`name should be provided.`);
  });

  it('should not allow to add boost when value is not provided', async () => {
    await expect(
      contract.writeInteraction({ function: 'addBoost', name: 'testBoost', adminId: 'asia' }, { strict: true })
    ).rejects.toThrow(`boostValue should be provided.`);
  });

  it(`should not allow to add boost when name is not of type 'string'`, async () => {
    await expect(
      contract.writeInteraction({ function: 'addBoost', name: 30, value: 5, adminId: 'asia' }, { strict: true })
    ).rejects.toThrow(`name should be of type 'string'.`);
  });

  it(`should not allow to add boost when value is not of type 'number'`, async () => {
    await expect(
      contract.writeInteraction(
        { function: 'addBoost', name: 'testBoost', boostValue: 'testBoostValue', adminId: 'asia' },
        { strict: true }
      )
    ).rejects.toThrow(`Invalid value for 'boostValue'. Must be an integer`);
  });

  it(`should not allow to add boost when adminId is not provided`, async () => {
    await expect(
      contract.writeInteraction({ function: 'addBoost', name: 'testBoost', boostValue: 5 }, { strict: true })
    ).rejects.toThrow(`adminId should be provided.`);
  });

  it('should not add boost if adminId not on admins list', async () => {
    await expect(
      contract.writeInteraction(
        { function: 'addBoost', name: 'testBoost', boostValue: 3, adminId: 'tomek' },
        { strict: true }
      )
    ).rejects.toThrow(`Only admin can add boost.`);
  });

  it('should correctly add boost', async () => {
    await contract.writeInteraction({ function: 'addBoost', name: 'testBoost', boostValue: 3, adminId: 'asia' });

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
      contract.writeInteraction(
        { function: 'addBoost', name: 'testBoost', boostValue: 5, adminId: 'asia' },
        { strict: true }
      )
    ).rejects.toThrow(`Boost with given name already exists.`);
  });

  it('should not allow to remove boost if no name is given', async () => {
    await expect(
      contract.writeInteraction({ function: 'removeBoost', adminId: 'asia' }, { strict: true })
    ).rejects.toThrow(`name should be provided.`);
  });

  it(`should not allow to remove boost if boost name is of type 'string'`, async () => {
    await expect(
      contract.writeInteraction({ function: 'removeBoost', name: 5, adminId: 'asia' }, { strict: true })
    ).rejects.toThrow(`name should be of type 'string'.`);
  });

  it('should not allow to remove boost if no adminId is given', async () => {
    await expect(
      contract.writeInteraction({ function: 'removeBoost', name: 'testBoost' }, { strict: true })
    ).rejects.toThrow(`adminId should be provided.`);
  });

  it(`should not allow to remove boost when adminId is not on admins list`, async () => {
    await expect(
      contract.writeInteraction({ function: 'removeBoost', name: 'testBoost', adminId: 'tomek' }, { strict: true })
    ).rejects.toThrow(`Only admin can remove boost.`);
  });

  it(`should not allow to remove boost if boost does not exist`, async () => {
    await expect(
      contract.writeInteraction(
        { function: 'removeBoost', name: 'incorrectTestBoost', adminId: 'asia' },
        { strict: true }
      )
    ).rejects.toThrow(`Boost with given name does not exist.`);
  });

  it('should remove boost correctly', async () => {
    await contract.writeInteraction({ function: 'removeBoost', name: 'testBoost', adminId: 'asia' });

    const boost = (
      await contract.viewState<{ function: string; name: string }, { boost: number }>({
        function: 'getBoost',
        name: 'testBoost',
      })
    ).result?.boost;

    expect(boost).toBe(undefined);
  });

  it('should not allow to change boost when name is not provided', async () => {
    await expect(
      contract.writeInteraction({ function: 'changeBoost', boostValue: 15, adminId: 'asia' }, { strict: true })
    ).rejects.toThrow(`name should be provided.`);
  });

  it('should not allow to change boost if no adminId is given', async () => {
    await expect(
      contract.writeInteraction({ function: 'changeBoost', boostValue: 15, name: 'testBoost' }, { strict: true })
    ).rejects.toThrow(`adminId should be provided.`);
  });

  it(`should not allow to change boost when adminId is not on admins list`, async () => {
    await expect(
      contract.writeInteraction(
        { function: 'changeBoost', boostValue: 15, adminId: 'tomek', name: 'testBoost' },
        { strict: true }
      )
    ).rejects.toThrow(`Only admin can change boost.`);
  });

  it('should not allow to change boost when value is not provided', async () => {
    await expect(
      contract.writeInteraction({ function: 'changeBoost', name: 'testChangeBoost', adminId: 'asia' }, { strict: true })
    ).rejects.toThrow(`boostValue should be provided.`);
  });

  it(`should not allow to change boost when name is not of type 'string'`, async () => {
    await expect(
      contract.writeInteraction({ function: 'changeBoost', name: 20, boostValue: 6, adminId: 'asia' }, { strict: true })
    ).rejects.toThrow(`name should be of type 'string'.`);
  });

  it(`should not allow to change boost when value is not an integer`, async () => {
    await expect(
      contract.writeInteraction(
        { function: 'changeBoost', name: 'testChangeBoost', boostValue: 'testChangeBoostValue', adminId: 'asia' },
        { strict: true }
      )
    ).rejects.toThrow(`Invalid value for 'boostValue'. Must be an integer`);
  });

  it('should correctly change boost', async () => {
    await contract.writeInteraction({ function: 'addBoost', name: 'testChangeBoost', boostValue: 3, adminId: 'asia' });
    await contract.writeInteraction({
      function: 'changeBoost',
      name: 'testChangeBoost',
      boostValue: 6,
      adminId: 'asia',
    });

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
        { function: 'changeBoost', name: 'incorrectTestChangeBoost', boostValue: 7, adminId: 'asia' },
        { strict: true }
      )
    ).rejects.toThrow(`Boost with given name does not exist.`);
  });

  it('should not allow to add user boost when name is not provided', async () => {
    await expect(
      contract.writeInteraction({ function: 'addUserBoost', userId: 'asia', adminId: 'asia' }, { strict: true })
    ).rejects.toThrow(`name should be provided.`);
  });

  it('should not allow to add user boost when user id is not provided', async () => {
    await expect(
      contract.writeInteraction(
        { function: 'addUserBoost', name: 'testChangeBoost', adminId: 'asia' },
        { strict: true }
      )
    ).rejects.toThrow(`userId should be provided.`);
  });

  it(`should not allow to add user boost when name is not of type 'string'`, async () => {
    await expect(
      contract.writeInteraction(
        { function: 'addUserBoost', name: 5, userId: 'asia', adminId: 'asia' },
        { strict: true }
      )
    ).rejects.toThrow(`name should be of type 'string'.`);
  });

  it(`should not allow to add boost when user id is not of type 'string'`, async () => {
    await expect(
      contract.writeInteraction(
        { function: 'addUserBoost', name: 'testChangeBoost', userId: 5, adminId: 'asia' },
        { strict: true }
      )
    ).rejects.toThrow(`userId should be of type 'string'.`);
  });

  it('should not allow to add user boost if no adminId is given', async () => {
    await expect(
      contract.writeInteraction({ function: 'addUserBoost', name: 'testChangeBoost', userId: 'asia' }, { strict: true })
    ).rejects.toThrow(`adminId should be provided.`);
  });

  it(`should not allow to add user boost when adminId is not on admins list`, async () => {
    await expect(
      contract.writeInteraction(
        { function: 'addUserBoost', name: 'testChangeBoost', userId: 'asia', adminId: 'tomek' },
        { strict: true }
      )
    ).rejects.toThrow(`Only admin can add user boost.`);
  });

  it('should correctly add user boost', async () => {
    await contract.writeInteraction({
      function: 'addUserBoost',
      name: 'testChangeBoost',
      userId: 'asia',
      adminId: 'asia',
    });

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
      contract.writeInteraction({ function: 'removeUserBoost', userId: 'asia', adminId: 'asia' }, { strict: true })
    ).rejects.toThrow(`name should be provided.`);
  });

  it('should not allow to remove user boost when user id is not provided', async () => {
    await expect(
      contract.writeInteraction(
        { function: 'removeUserBoost', name: 'testChangeBoost', adminId: 'asia' },
        { strict: true }
      )
    ).rejects.toThrow(`userId should be provided.`);
  });

  it(`should not allow to remove user boost when name is not of type 'string'`, async () => {
    await expect(
      contract.writeInteraction(
        { function: 'removeUserBoost', name: 5, userId: 'asia', adminId: 'asia' },
        { strict: true }
      )
    ).rejects.toThrow(`name should be of type 'string'.`);
  });

  it(`should not allow to remove boost when user id is not of type 'string'`, async () => {
    await expect(
      contract.writeInteraction(
        { function: 'removeUserBoost', name: 'testChangeBoost', userId: 5, adminId: 'asia' },
        { strict: true }
      )
    ).rejects.toThrow(`userId should be of type 'string'.`);
  });

  it('should not allow to remove user boost if no adminId is given', async () => {
    await expect(
      contract.writeInteraction(
        { function: 'removeUserBoost', name: 'testChangeBoost', userId: 'asia' },
        { strict: true }
      )
    ).rejects.toThrow(`adminId should be provided.`);
  });

  it(`should not allow to remove user boost when adminId is not on admins list`, async () => {
    await expect(
      contract.writeInteraction(
        { function: 'removeUserBoost', name: 'testChangeBoost', userId: 'asia', adminId: 'tomek' },
        { strict: true }
      )
    ).rejects.toThrow(`Only admin can remove user boost.`);
  });

  it(`should not allow to remove boost when boost is not assigned to user`, async () => {
    await expect(
      contract.writeInteraction(
        { function: 'removeUserBoost', name: 'incorrectTestChangeBoost', userId: 'asia', adminId: 'asia' },
        { strict: true }
      )
    ).rejects.toThrow(`Boost not found.`);
  });

  it('should correctly remove user boost', async () => {
    await contract.writeInteraction({
      function: 'removeUserBoost',
      name: 'testChangeBoost',
      userId: 'asia',
      adminId: 'asia',
    });
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
    await contract.writeInteraction({
      function: 'addUserBoost',
      name: 'testChangeBoost',
      userId: 'asia',
      adminId: 'asia',
    });
    await contract.writeInteraction({
      function: 'addMessage',
      id: 'asia',
      content: 'randomContent',
      messageId: '66',
      roles: ['admin'],
    });

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
    await contract.writeInteraction({
      function: 'addReaction',
      userId: 'asia',
      messageId: '1234',
      emoji: 'hearthpulse',
      roles: ['admin'],
    });

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
    await contract.writeInteraction({ function: 'removeMessage', userId: 'asia', messageId: '66' });

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
    await contract.writeInteraction({
      function: 'removeReaction',
      userId: 'asia',
      messageId: '1234',
      emoji: 'hearthpulse',
    });

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
    await contract.writeInteraction({ function: 'addBoost', name: 'secondTestBoost', boostValue: 3, adminId: 'asia' });
    await contract.writeInteraction({
      function: 'addUserBoost',
      name: 'secondTestBoost',
      userId: 'asia',
      adminId: 'asia',
    });
    await contract.writeInteraction({
      function: 'addReaction',
      userId: 'asia',
      messageId: '123',
      emoji: 'hearthpulse',
      roles: ['admin'],
    });
    await contract.writeInteraction({
      function: 'addMessage',
      id: 'asia',
      content: 'randomContent',
      messageId: '77',
      roles: ['admin'],
    });

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

  it(`should not allow to add points when members are not provided`, async () => {
    await expect(
      contract.writeInteraction({ function: 'addPoints', points: 5, adminId: 'testAdmin' }, { strict: true })
    ).rejects.toThrow(`members should be provided.`);
  });

  it(`should not allow to add points when points are not provided`, async () => {
    await expect(
      contract.writeInteraction(
        { function: 'addPoints', adminId: 'testAdmin', members: [{ id: 'asia', roles: 'user' }] },
        { strict: true }
      )
    ).rejects.toThrow(`points should be provided.`);
  });

  it(`should not allow to add points when adminId is not provided`, async () => {
    await expect(
      contract.writeInteraction(
        { function: 'addPoints', points: 5, members: [{ id: 'asia', roles: 'user' }] },
        { strict: true }
      )
    ).rejects.toThrow(`adminId should be provided.`);
  });

  it(`should not allow to add points when adminId is not on admins list`, async () => {
    await expect(
      contract.writeInteraction(
        { function: 'addPoints', points: 5, adminId: 'incorrectTestAdmin', members: [{ id: 'asia', roles: 'user' }] },
        { strict: true }
      )
    ).rejects.toThrow(`Only admin can award points.`);
  });

  it('should correctly award points', async () => {
    await contract.writeInteraction({
      function: 'addPoints',
      points: 5,
      adminId: 'testAdmin',
      members: [{ id: 'asia', roles: 'user' }],
      noBoost: false,
    });

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

  it(`should not allow to remove points when members are not provided`, async () => {
    await expect(
      contract.writeInteraction({ function: 'removePoints', points: 5, adminId: 'testAdmin' }, { strict: true })
    ).rejects.toThrow(`members should be provided.`);
  });

  it(`should not allow to remove points when points are not provided`, async () => {
    await expect(
      contract.writeInteraction(
        { function: 'removePoints', members: [{ id: 'asia', roles: ['user'] }], adminId: 'testAdmin' },
        { strict: true }
      )
    ).rejects.toThrow(`points should be provided.`);
  });

  it(`should not allow to remove points when adminId is not provided`, async () => {
    await expect(
      contract.writeInteraction(
        { function: 'removePoints', members: [{ id: 'asia', roles: ['user'] }], points: 5 },
        { strict: true }
      )
    ).rejects.toThrow(`adminId should be provided.`);
  });

  it(`should not allow to remove points when adminId is not on admins list`, async () => {
    await expect(
      contract.writeInteraction(
        {
          function: 'removePoints',
          members: [{ id: 'asia', roles: ['user'] }],
          points: 5,
          adminId: 'incorrectTestAdmin',
        },
        { strict: true }
      )
    ).rejects.toThrow(`Only admin can remove points.`);
  });

  it('should correctly remove points', async () => {
    await contract.writeInteraction({
      function: 'removePoints',
      members: [{ id: 'asia', roles: ['admin'] }],
      points: 5,
      adminId: 'testAdmin',
    });

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
        { function: 'addSeason', from: 123456, to: 654321, boost: 'seasonBoost', adminId: 'asia' },
        { strict: true }
      )
    ).rejects.toThrow(`name should be provided.`);
  });

  it(`should not allow to add season when from timestamp is not provided`, async () => {
    await expect(
      contract.writeInteraction(
        { function: 'addSeason', name: 'seasonName', to: 654321, boost: 'seasonBoost', adminId: 'asia' },
        { strict: true }
      )
    ).rejects.toThrow(`from should be provided.`);
  });

  it(`should not allow to add season when to timestamp is not provided`, async () => {
    await expect(
      contract.writeInteraction(
        { function: 'addSeason', name: 'seasonName', from: 123456, boost: 'seasonBoost', adminId: 'asia' },
        { strict: true }
      )
    ).rejects.toThrow(`to should be provided.`);
  });

  it(`should not allow to add season when boost is not provided`, async () => {
    await expect(
      contract.writeInteraction(
        { function: 'addSeason', name: 'seasonName', from: 123456, to: 654321, adminId: 'asia' },
        { strict: true }
      )
    ).rejects.toThrow(`boost should be provided.`);
  });

  it(`should not allow to add season when boost is not on the list`, async () => {
    await expect(
      contract.writeInteraction(
        {
          function: 'addSeason',
          name: 'seasonName',
          from: 123456,
          to: 654321,
          boost: 'nonExistingBoost',
          adminId: 'asia',
        },
        { strict: true }
      )
    ).rejects.toThrow(`Boost with given name does not exist. Please add boost first.`);
  });

  it('should not add season if adminId is not provided', async () => {
    await expect(
      contract.writeInteraction(
        {
          function: 'addSeason',
          name: 'seasonName',
          from: 123456,
          to: 654321,
          boost: 'seasonBoost',
        },
        { strict: true }
      )
    ).rejects.toThrow(`adminId should be provided.`);
  });

  it('should not add admin if adminId not on admins list', async () => {
    await expect(
      contract.writeInteraction(
        {
          function: 'addSeason',
          name: 'seasonName',
          from: 123456,
          to: 654321,
          boost: 'seasonBoost',
          adminId: 'tomek',
        },
        { strict: true }
      )
    ).rejects.toThrow(`Only admin can add season.`);
  });

  it('should properly add season', async () => {
    await contract.writeInteraction({ function: 'addBoost', name: 'seasonBoost', boostValue: 2, adminId: 'asia' });
    await contract.writeInteraction({
      function: 'addSeason',
      name: 'seasonName',
      from: 123456,
      to: 654321,
      boost: 'seasonBoost',
      adminId: 'asia',
    });

    const { cachedValue } = await contract.readState();
    expect(JSON.stringify(cachedValue.state.seasons['seasonName'])).toBe(
      JSON.stringify({ from: 123456, to: 654321, boost: 'seasonBoost' })
    );
  });

  it('should add message points according to season boost', async () => {
    await contract.writeInteraction({
      function: 'addSeason',
      name: 'seasonName2',
      from: Math.round((currentTimestamp - 9000) / 1000),
      to: Math.round((currentTimestamp + 9000) / 1000),
      boost: 'seasonBoost',
      adminId: 'asia',
    });
    await contract.writeInteraction({
      function: 'addMessage',
      id: 'asia',
      messageId: '55',
      content: 'randomContent',
      roles: ['admin'],
    });

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
    await contract.writeInteraction({
      function: 'addReaction',
      userId: 'asia',
      messageId: '123',
      emoji: 'hearthpulse',
      roles: ['admin'],
    });

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

  it(`should not allow to add season to role when name is not provided`, async () => {
    await expect(
      contract.writeInteraction(
        {
          function: 'addSeasonToRole',
          from: '123456',
          to: '654321',
          boost: 'seasonToRoleBoost',
          boostValue: 5,
          role: 'role',
          adminId: 'asia',
        },
        { strict: true }
      )
    ).rejects.toThrow(`name should be provided.`);
  });

  it(`should not allow to add season to role when from timestamp is not provided`, async () => {
    await expect(
      contract.writeInteraction(
        {
          function: 'addSeasonToRole',
          name: 'seasonToRole',
          to: '654321',
          boost: 'seasonToRoleBoost',
          boostValue: 5,
          role: 'role',
          adminId: 'asia',
        },
        { strict: true }
      )
    ).rejects.toThrow(`from should be provided.`);
  });

  it(`should not allow to add season to role when to timestamp is not provided`, async () => {
    await expect(
      contract.writeInteraction(
        {
          function: 'addSeasonToRole',
          name: 'seasonToRole',
          from: 654321,
          boost: 'seasonToRoleBoost',
          boostValue: 5,
          role: 'role',
          adminId: 'asia',
        },
        { strict: true }
      )
    ).rejects.toThrow(`to should be provided.`);
  });

  it(`should not allow to add season to role when boost is not provided`, async () => {
    await expect(
      contract.writeInteraction(
        {
          function: 'addSeasonToRole',
          name: 'seasonToRole',
          to: 12345,
          from: 654321,
          boostValue: 5,
          role: 'role',
          adminId: 'asia',
        },
        { strict: true }
      )
    ).rejects.toThrow(`boost should be provided.`);
  });

  it(`should not allow to add season to role when boost value is not provided`, async () => {
    await expect(
      contract.writeInteraction(
        {
          function: 'addSeasonToRole',
          name: 'seasonToRole',
          to: 12345,
          from: 654321,
          boost: 'seasonToRole',
          role: 'role',
          adminId: 'asia',
        },
        { strict: true }
      )
    ).rejects.toThrow(`boostValue should be provided.`);
  });

  it('should properly add season to role', async () => {
    await contract.writeInteraction({
      function: 'addSeasonToRole',
      name: 'seasonToRole',
      to: 12345,
      from: 654321,
      boost: 'seasonToRoleBoost',
      boostValue: 5,
      role: 'role',
      adminId: 'asia',
    });

    const { cachedValue } = await contract.readState();
    expect(JSON.stringify(cachedValue.state.seasons['seasonToRole'])).toBe(
      JSON.stringify({ from: 654321, to: 12345, boost: 'seasonToRoleBoost', role: 'role' })
    );
    expect(cachedValue.state.boosts['seasonToRoleBoost']).toBe(5);
  });

  it('should add message points according to season to role boost', async () => {
    await contract.writeInteraction({
      function: 'removeUserBoost',
      userId: 'asia',
      name: 'testChangeBoost',
      adminId: 'asia',
    });
    await contract.writeInteraction({
      function: 'removeUserBoost',
      userId: 'asia',
      name: 'secondTestBoost',
      adminId: 'asia',
    });

    const { cachedValue } = await contract.readState();
    console.log(cachedValue.state.counter['asia']);

    await contract.writeInteraction({
      function: 'addSeasonToRole',
      name: 'seasonToRole2',
      from: Math.round((currentTimestamp - 9000) / 1000),
      to: Math.round((currentTimestamp + 9000) / 1000),
      boost: 'seasonToRoleBoost2',
      boostValue: 5,
      role: 'admin',
      adminId: 'asia',
    });
    await contract.writeInteraction({
      function: 'addMessage',
      id: 'asia',
      messageId: '00',
      content: 'randomContent',
      roles: ['admin'],
    });

    const balance = (
      await contract.viewState<
        { function: string; target: string },
        { target: string; ticker: string; balance: number }
      >({ function: 'balance', target: owner })
    ).result?.balance;

    expect(balance).toEqual(180 + 1800 + 3600 + 360 + 1000);
    const counter = (
      await contract.viewState<
        { function: string; id: string },
        { counter: { messages: number; reactions: number; points: number } }
      >({
        function: 'getCounter',
        id: 'asia',
      })
    ).result?.counter;
    expect(counter.points).toEqual(100 + 180 + 1800 + 3600 + 360 + 1000);
  });

  it('should add reaction points according to season to role boost', async () => {
    await contract.writeInteraction({
      function: 'addReaction',
      userId: 'asia',
      messageId: '123',
      emoji: 'hearthpulse',
      roles: ['admin'],
    });

    const balance = (
      await contract.viewState<
        { function: string; target: string },
        { target: string; ticker: string; balance: number }
      >({ function: 'balance', target: owner })
    ).result?.balance;

    expect(balance).toEqual(180 + 1800 + 3600 + 360 + 1000 + 100);
    const counter = (
      await contract.viewState<
        { function: string; id: string },
        { counter: { messages: number; reactions: number; points: number } }
      >({
        function: 'getCounter',
        id: 'asia',
      })
    ).result?.counter;
    expect(counter.points).toEqual(100 + 180 + 1800 + 3600 + 360 + 1000 + 100);
  });

  it('should not boost points when noBoost flag is set to true', async () => {
    await contract.writeInteraction({
      function: 'addPoints',
      points: 1,
      adminId: 'testAdmin',
      members: [{ id: 'asia', roles: 'admin' }],
      noBoost: true,
    });

    const balance = (
      await contract.viewState<
        { function: string; target: string },
        { target: string; ticker: string; balance: number }
      >({ function: 'balance', target: owner })
    ).result?.balance;

    expect(balance).toEqual(180 + 1800 + 3600 + 360 + 1000 + 100 + 1);
    const counter = (
      await contract.viewState<
        { function: string; id: string },
        { counter: { messages: number; reactions: number; points: number } }
      >({
        function: 'getCounter',
        id: 'asia',
      })
    ).result?.counter;
    expect(counter.points).toEqual(100 + 180 + 1800 + 3600 + 360 + 1000 + 100 + 1);
  });

  it('should not boost removed points when noBoost flag is set to true', async () => {
    await contract.writeInteraction({
      function: 'removePoints',
      members: [{ id: 'asia', roles: ['admin'] }],
      points: 1,
      adminId: 'testAdmin',
      noBoost: true,
    });

    const balance = (
      await contract.viewState<
        { function: string; target: string },
        { target: string; ticker: string; balance: number }
      >({ function: 'balance', target: owner })
    ).result?.balance;

    expect(balance).toEqual(180 + 1800 + 3600 + 360 + 1000 + 100 + 1 - 1);
    const counter = (
      await contract.viewState<
        { function: string; id: string },
        { counter: { messages: number; reactions: number; points: number } }
      >({
        function: 'getCounter',
        id: 'asia',
      })
    ).result?.counter;
    expect(counter.points).toEqual(100 + 180 + 1800 + 3600 + 360 + 1000 + 100 + 1 - 1);
  });

  it('should correctly award points to multiple members', async () => {
    await contract.writeInteraction({
      function: 'addPoints',
      points: 1,
      adminId: 'testAdmin',
      members: [
        { id: 'asia', roles: ['admin'] },
        { id: 'tomek', roles: 'user' },
      ],
      noBoost: true,
    });

    const balance = (
      await contract.viewState<
        { function: string; target: string },
        { target: string; ticker: string; balance: number }
      >({ function: 'balance', target: owner })
    ).result?.balance;

    expect(balance).toEqual(180 + 1800 + 3600 + 360 + 1000 + 100 + 1 - 1 + 1);
    const counter = (
      await contract.viewState<
        { function: string; id: string },
        { counter: { messages: number; reactions: number; points: number } }
      >({
        function: 'getCounter',
        id: 'asia',
      })
    ).result?.counter;
    expect(counter.points).toEqual(100 + 180 + 1800 + 3600 + 360 + 1000 + 100 + 1 - 1 + 1);

    const balance2 = (
      await contract.viewState<
        { function: string; target: string },
        { target: string; ticker: string; balance: number }
      >({ function: 'balance', target: owner2 })
    ).result?.balance;

    expect(balance2).toEqual(200 + 1);
    const counter2 = (
      await contract.viewState<
        { function: string; id: string },
        { counter: { messages: number; reactions: number; points: number } }
      >({
        function: 'getCounter',
        id: 'tomek',
      })
    ).result?.counter;
    expect(counter2.points).toEqual(100 + 1);
  });
});
