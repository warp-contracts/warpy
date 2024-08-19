import ArLocal from 'arlocal';
import { JWKInterface } from 'arweave/node/lib/wallet';
import fs from 'fs';
import path from 'path';
import { DeployPlugin } from 'warp-contracts-plugin-deploy';
import { ContractState } from '../src/warpDiscordBot/types/types';
import { LoggerFactory, Warp, WarpFactory, Contract } from 'warp-contracts';
import { VRFPlugin } from 'warp-contracts-plugin-vrf';

jest.setTimeout(30000);

describe('Testing warpDiscordBot contract', () => {
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
    arlocal = new ArLocal(1820, false);
    await arlocal.start();

    LoggerFactory.INST.logLevel('info');

    warp = WarpFactory.forLocal(1820).use(new DeployPlugin()).use(new VRFPlugin());

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
        max: 3,
        timeLagInSeconds: 50,
      },
      rouletteEntry: 500,
      divisibility: 1000,
      rouletteOn: false,
      counter: {
        '123': {
          messages: 5,
          reactions: 6,
          points: 5,
          boosts: ['1'],
        },
      },
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
        { function: 'addMessage', userId: 'asia', messageId: '1', roles: ['admin'] },
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
    ).rejects.toThrow(`userId should be provided.`);
  });

  it('should not add message with no messageId', async () => {
    await expect(
      contract.writeInteraction(
        { function: 'addMessage', content: 'randomContent', userId: 'asia', roles: ['admin'] },
        { strict: true }
      )
    ).rejects.toThrow(`messageId should be provided.`);
  });

  it('should properly add message', async () => {
    await contract.writeInteraction({
      function: 'addMessage',
      userId: 'asia',
      content: 'randomContent',
      messageId: '1',
      roles: ['admin'],
    });
    const balance = (
      await contract.viewState<
        { function: string; target: string },
        { target: string; ticker: string; balance: number }
      >({ function: 'balance', target: owner })
    ).result.balance;
    expect(balance).toEqual(100);
  });

  it('should properly add second message', async () => {
    await contract.writeInteraction({
      function: 'addMessage',
      userId: 'asia',
      messageId: '2',
      content: 'randomContent',
      roles: ['admin'],
    });
    const balance = (
      await contract.viewState<
        { function: string; target: string },
        { target: string; ticker: string; balance: number }
      >({ function: 'balance', target: owner })
    ).result.balance;
    expect(balance).toEqual(200);
  });

  it('should properly add reaction', async () => {
    const emoji = '🫡';
    let updated = emoji.replace(/\p{Emoji}/gu, (m, idx) => m.codePointAt(0).toString(16));
    await contract.writeInteraction({
      function: 'addReaction',
      userId: 'asia',
      messageId: '123',
      emojiId: updated,
      roles: ['admin'],
    });
    const balance = (
      await contract.viewState<
        { function: string; target: string },
        { target: string; ticker: string; balance: number }
      >({ function: 'balance', target: owner })
    ).result.balance;
    expect(balance).toEqual(210);
  });

  it('should correctly transfer tokens', async () => {
    await contract.writeInteraction({ function: 'transfer', target: owner2, qty: 100 });

    const balance = (
      await contract.viewState<
        { function: string; target: string },
        { target: string; ticker: string; balance: number }
      >({ function: 'balance', target: owner2 })
    ).result?.balance;

    expect(balance).toEqual(100);
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
  });

  it('should properly remove reaction', async () => {
    const emoji = '🫡';
    const updated = emoji.replace(/\p{Emoji}/gu, (m, idx) => m.codePointAt(0).toString(16));

    await contract.writeInteraction({
      function: 'removeReaction',
      userId: 'asia',
      messageId: '123',
      emojiId: updated,
    });

    const balance = (
      await contract.viewState<
        { function: string; target: string },
        { target: string; ticker: string; balance: number }
      >({ function: 'balance', target: owner })
    ).result?.balance;

    expect(balance).toEqual(0);
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

  it('should throw when removing non-existing reaction', async () => {
    await expect(
      contract.writeInteraction(
        {
          function: 'removeReaction',
          userId: 'asia',
          messageId: '1234',
          emojiId: ':TEST:RSG:',
        },
        { strict: true }
      )
    ).rejects.toThrow('Reaction not found.');
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
    ).rejects.toThrow(`Invalid points for member asia`);
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

    expect(balance).toEqual(5);
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
    ).rejects.toThrow(`points should be provided`);
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

    expect(balance).toEqual(0);
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
      userId: 'asia',
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

    expect(balance).toEqual(200);
  });

  it('should add reaction points according to season boost', async () => {
    await contract.writeInteraction({
      function: 'addReaction',
      userId: 'asia',
      messageId: '123456',
      emojiId: 'hearthpulse',
      roles: ['admin'],
    });

    const balance = (
      await contract.viewState<
        { function: string; target: string },
        { target: string; ticker: string; balance: number }
      >({ function: 'balance', target: owner })
    ).result?.balance;

    expect(balance).toEqual(200 + 20);
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
      userId: 'asia',
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

    expect(balance).toEqual(200 + 20 + 700);
  });

  it('should add reaction points according to season to role boost', async () => {
    await contract.writeInteraction({
      function: 'addReaction',
      userId: 'asia',
      messageId: '1234567',
      emojiId: 'hearthpulse',
      roles: ['admin'],
    });

    const balance = (
      await contract.viewState<
        { function: string; target: string },
        { target: string; ticker: string; balance: number }
      >({ function: 'balance', target: owner })
    ).result?.balance;

    expect(balance).toEqual(200 + 20 + 700 + 70);
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

    expect(balance).toEqual(200 + 20 + 700 + 70 + 1);
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

    expect(balance).toEqual(200 + 20 + 700 + 70);
  });

  it('should correctly award points to multiple members', async () => {
    await contract.writeInteraction({ function: 'registerUser', id: 'tomek', address: owner2 });
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

    expect(balance).toEqual(200 + 20 + 700 + 70 + 1);

    const balance2 = (
      await contract.viewState<
        { function: string; target: string },
        { target: string; ticker: string; balance: number }
      >({ function: 'balance', target: owner2 })
    ).result?.balance;

    expect(balance2).toEqual(100 + 1);
  });

  it('should not allow to send more than maximum number of reactions in specific time lag', async () => {
    await contract.writeInteraction({
      function: 'addReaction',
      userId: 'asia',
      messageId: '9',
      emojiId: 'sad',
      roles: ['admin'],
    });

    const balance = (
      await contract.viewState<
        { function: string; target: string },
        { target: string; ticker: string; balance: number }
      >({ function: 'balance', target: owner })
    ).result?.balance;

    expect(balance).toEqual(200 + 20 + 700 + 70 + 1 + 70);

    await contract.writeInteraction({
      function: 'addReaction',
      userId: 'asia',
      messageId: '99',
      emojiId: 'happy',
      roles: ['admin'],
    });

    await expect(
      contract.writeInteraction(
        {
          function: 'addReaction',
          userId: 'asia',
          messageId: '999',
          emojiId: 'angry',
          roles: ['admin'],
        },
        { strict: true }
      )
    ).rejects.toThrow('User cannot sent more than 3 reactions in 50 seconds.');

    const balance2 = (
      await contract.viewState<
        { function: string; target: string },
        { target: string; ticker: string; balance: number }
      >({ function: 'balance', target: owner })
    ).result?.balance;

    expect(balance2).toEqual(200 + 20 + 700 + 70 + 1 + 70);
  });

  it('should allow user to send another reaction in specific time lag if last reaction in this time lag has been removed', async () => {
    await contract.writeInteraction({
      function: 'removeReaction',
      userId: 'asia',
      messageId: '99',
      emojiId: '🫡',
    });

    await expect(
      contract.writeInteraction({
        function: 'addReaction',
        userId: 'asia',
        messageId: '999',
        emojiId: 'angry',
        roles: ['admin'],
      })
    ).resolves.toBeTruthy();

    const balance = (
      await contract.viewState<
        { function: string; target: string },
        { target: string; ticker: string; balance: number }
      >({ function: 'balance', target: owner })
    ).result?.balance;

    expect(balance).toEqual(200 + 20 + 700 + 70 + 1 + 70);
  });

  it('should correctly display ranking', async () => {
    const result = (
      await contract.viewState<
        { function: string; limit: number },
        { ranking: { lp: number; userId: string; balance: number }[] }
      >({
        function: 'getRanking',
        limit: 15,
      })
    ).result;
    expect(result.ranking.length).toBe(2);
  });

  it('should correctly display user position in ranking', async () => {
    const result = (
      await contract.viewState<
        { function: string; limit: number; address: string },
        {
          ranking: { lp: number; userId: string; balance: number }[];
          userPosition: { lp: number; userId: string; balance: number };
        }
      >({
        function: 'getRanking',
        limit: 15,
        address: owner,
      })
    ).result;
    expect(result.userPosition.userId).toBe('asia');
  });

  it('should correctly get user id based on address', async () => {
    const userId = (
      await contract.viewState<{ function: string; address: string }, { userId: string }>({
        function: 'getUserId',
        address: owner,
      })
    ).result.userId;

    expect(userId).toBe('asia');
  });

  it('should not allow to add roulette picks when adminId is not provided', async () => {
    await expect(
      contract.writeInteraction({ function: 'addRoulettePicks', roulettePicks: [] }, { strict: true })
    ).rejects.toThrow('adminId should be provided.');
  });

  it(`should not allow to add roulette picks when roulettePick are not provided`, async () => {
    await expect(
      contract.writeInteraction({ function: 'addRoulettePicks', adminId: 'asia' }, { strict: true })
    ).rejects.toThrow('roulettePicks should be provided.');
  });

  it(`should not allow to add roulette picks when adminId is not of type 'string'`, async () => {
    await expect(
      contract.writeInteraction({ function: 'addRoulettePicks', roulettePicks: [], adminId: 5 }, { strict: true })
    ).rejects.toThrow(`adminId should be of type 'string'.`);
  });

  it(`should not allow to add roulette picks when adminId is not on admins list`, async () => {
    await expect(
      contract.writeInteraction({ function: 'addRoulettePicks', roulettePicks: [], adminId: 'tomek' }, { strict: true })
    ).rejects.toThrow('Only admin can add roulette picks.');
  });

  it('should properly add roulette picks', async () => {
    await contract.writeInteraction({
      function: 'addRoulettePicks',
      roulettePicks: [
        { value: 1, weight: 400 },
        { value: 250, weight: 270 },
        { value: 500, weight: 200 },
        { value: 1000, weight: 95 },
        { value: 10000, weight: 25 },
        { value: 100000, weight: 10 },
      ],
      adminId: 'asia',
    });

    const { cachedValue } = await contract.readState();

    expect(JSON.stringify(cachedValue.state.roulettePicks)).toBe(
      JSON.stringify([
        { value: 1, weight: 400 },
        { value: 250, weight: 270 },
        { value: 500, weight: 200 },
        { value: 1000, weight: 95 },
        { value: 10000, weight: 25 },
        { value: 100000, weight: 10 },
      ])
    );
  });

  it('should not allow to start roulette when roulette is not switched on', async () => {
    await expect(
      contract.writeInteraction(
        { function: 'playRoulette', userId: 'asia', interactionId: '7890', roles: ['asia'] },
        { strict: true }
      )
    ).rejects.toThrow('Roulette not switched on.');
  });

  it('should not allow to switch roulette on when adminId is not provided', async () => {
    await expect(contract.writeInteraction({ function: 'switchRoulette' }, { strict: true })).rejects.toThrow(
      'adminId should be provided.'
    );
  });

  it(`should not allow to switch roulette when adminId is not of type 'string'`, async () => {
    await expect(
      contract.writeInteraction({ function: 'switchRoulette', adminId: 5 }, { strict: true })
    ).rejects.toThrow(`adminId should be of type 'string'`);
  });

  it(`should not allow to switch roulette when adminId is not on the list`, async () => {
    await expect(
      contract.writeInteraction({ function: 'switchRoulette', adminId: 'tomek' }, { strict: true })
    ).rejects.toThrow(`Only admin can switch roulette.`);
  });

  it('should correctly switch roulette on', async () => {
    await contract.writeInteraction({ function: 'switchRoulette', adminId: 'asia' });
    const { cachedValue } = await contract.readState();
    expect(cachedValue.state.rouletteOn).toBeTruthy();
  });

  it('should not allow to start roulette when userId is not passed', async () => {
    await contract.writeInteraction({ function: 'registerUser', id: 'rouletteUser', address: owner3 });
    await contract.writeInteraction({ function: 'mint', id: 'rouletteUser' });

    await expect(
      contract.writeInteraction({ function: 'playRoulette', interactionId: '7890' }, { strict: true })
    ).rejects.toThrow('userId should be provided.');
  });

  it('should not allow to start roulette when interactionId is not passed', async () => {
    await expect(
      contract.writeInteraction(
        { function: 'playRoulette', userId: 'rouletteUser', roles: ['rouletteUser'] },
        { strict: true }
      )
    ).rejects.toThrow('interactionId should be provided.');
  });

  it('should not allow to start roulette when userId is not of type string', async () => {
    await expect(
      contract.writeInteraction({ function: 'playRoulette', userId: 123, interactionId: '7890' }, { strict: true })
    ).rejects.toThrow(`userId should be of type 'string'`);
  });

  it('should not allow to start roulette when interactionId is not of type string', async () => {
    await expect(
      contract.writeInteraction(
        { function: 'playRoulette', userId: 'rouletteUser', interactionId: 123, roles: ['rouletteUser'] },
        { strict: true }
      )
    ).rejects.toThrow(`interactionId should be of type 'string'`);
  });

  it('should not allow to start roulette when user cannot be found', async () => {
    await expect(
      contract.writeInteraction(
        {
          function: 'playRoulette',
          userId: 'rouletteUser non-existing',
          interactionId: '7890',
          roles: ['rouletteUser'],
        },
        { strict: true }
      )
    ).rejects.toThrow(`User not found.`);
  });

  it(`should not allow to start roulette when user does not have any points`, async () => {
    await expect(
      contract.writeInteraction(
        { function: 'playRoulette', userId: 'rouletteUser', interactionId: '7890', roles: ['rouletteUser'] },
        { strict: true }
      )
    ).rejects.toThrow(`User does not have enough balance to enter the game. Balance: 0.`);
  });

  it('should not allow to start roulette when user does not have enough points', async () => {
    await contract.writeInteraction({
      function: 'addPoints',
      points: 499,
      adminId: 'asia',
      members: [{ id: 'rouletteUser', roles: 'user' }],
      noBoost: false,
    });
    await expect(
      contract.writeInteraction(
        { function: 'playRoulette', userId: 'rouletteUser', interactionId: '7890', roles: ['rouletteUser'] },
        { strict: true }
      )
    ).rejects.toThrow(`User does not have enough balance to enter the game. Balance: 499.`);
  });

  it('should correctly play roulette', async () => {
    await contract.writeInteraction({
      function: 'addPoints',
      points: 120,
      adminId: 'asia',
      members: [{ id: 'rouletteUser', roles: 'user' }],
      noBoost: false,
    });

    await contract.writeInteraction(
      { function: 'playRoulette', userId: 'rouletteUser', interactionId: '7890', roles: ['rouletteUser'] },
      { vrf: true }
    );
    const result = (
      await contract.viewState<
        { function: string; target: string },
        { target: string; ticker: string; balance: number }
      >({ function: 'balance', target: owner3 })
    ).result;

    expect(result.balance).toBeGreaterThan(0);
  });

  it(`should properly get user's roulette pick`, async () => {
    const result = (
      await contract.viewState<{ function: string; userId: string; interactionId: string }, { pick: number }>({
        function: 'getRoulettePick',
        userId: 'rouletteUser',
        interactionId: '7890',
      })
    ).result;

    expect(result.pick).toBeTruthy();
  });

  it('should not allow to change user wallet to an existing one', async () => {
    await expect(
      contract.writeInteraction({ function: 'changeWallet', id: 'tomek', address: owner }, { strict: true })
    ).rejects.toThrow('Address already assigned');
  });

  it('should not allow to change user wallet if there is no id', async () => {
    await expect(
      contract.writeInteraction(
        { function: 'changeWallet', id: 'non-existing', address: 'new address' },
        { strict: true }
      )
    ).rejects.toThrow('Id not registered');
  });

  it('should correctly change user wallet', async () => {
    await contract.writeInteraction(
      { function: 'changeWallet', id: 'tomek', address: 'new address' },
      { strict: true }
    );

    const address = (
      await contract.viewState<{ function: string; id: string }, { address: string }>({
        function: 'getAddress',
        id: 'tomek',
      })
    ).result.address;
    expect(address).toEqual('new address');
  });

  it('should return the same balance after changing the wallet', async () => {
    const result = await contract.viewState<
      { function: string; target: string },
      { target: string; ticker: string; balance: number }
    >({ function: 'balance', target: 'new address' });

    expect(result.result.balance).toEqual(101);
  });

  it('should correctly remove the counter', async () => {
    await contract.writeInteraction({ function: 'removeCounter' });

    expect(Object.keys((await contract.readState()).cachedValue.state.counter).length).toEqual(0);
  });
});
