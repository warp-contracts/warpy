import ArLocal from 'arlocal';
import { JWKInterface } from 'arweave/node/lib/wallet';
import fs from 'fs';
import path from 'path';
import { DeployPlugin } from 'warp-contracts-plugin-deploy';
import { ContractState } from '../src/warpDiscordBot/types/types';
import { LoggerFactory, Warp, WarpFactory, Contract } from 'warp-contracts';

jest.setTimeout(30000);

describe('Testing Contract contract', () => {
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

  beforeAll(async () => {
    arlocal = new ArLocal(1820, false);
    await arlocal.start();

    LoggerFactory.INST.logLevel('info');

    warp = WarpFactory.forLocal(1820).use(new DeployPlugin());

    ({ jwk: ownerWallet, address: owner } = await warp.generateWallet());
    ({ jwk: ownerWallet2, address: owner2 } = await warp.generateWallet());

    const creationTimestamp = Date.now();
    initialState = {
      owner,
      serverName: 'TEST_SERVER',
      creationTimestamp,
      ticker: 'TEST_SERVER_TICKER',
      name: 'Test Server',
      messagesTokenWeight: 100,
      reactionsTokenWeight: 10,
      balances: {},
      users: {},
      counter: {},
      messages: {},
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
      await contract.viewState<{ function: string; id: string }, { counter: { messages: number; reactions: number } }>({
        function: 'getCounter',
        id: 'asia',
      })
    ).result?.counter;
    expect(counter.messages).toEqual(1);
  });

  it('should properly add second message', async () => {
    await contract.writeInteraction({ function: 'addMessage', id: 'asia', messageId: '2', content: 'randomContent' });
    const counter = (
      await contract.viewState<{ function: string; id: string }, { counter: { messages: number; reactions: number } }>({
        function: 'getCounter',
        id: 'asia',
      })
    ).result?.counter;
    expect(counter.messages).toEqual(2);
  });

  it('should properly add second user message', async () => {
    await contract.writeInteraction({ function: 'addMessage', id: 'tomek', content: 'randomContent', messageId: '3' });
    const counter = (
      await contract.viewState<{ function: string; id: string }, { counter: { messages: number; reactions: number } }>({
        function: 'getCounter',
        id: 'tomek',
      })
    ).result?.counter;
    expect(counter.messages).toEqual(1);
  });

  it('should properly add reaction', async () => {
    await contract.writeInteraction({ function: 'addReaction', id: 'asia' });
    const counter = (
      await contract.viewState<{ function: string; id: string }, { counter: { messages: number; reactions: number } }>({
        function: 'getCounter',
        id: 'asia',
      })
    ).result?.counter;
    expect(counter.reactions).toEqual(1);
    expect(counter.messages).toEqual(2);
  });

  it('should correctly set tokens when adding a message and a reaction', async () => {
    const balance = (
      await contract.viewState<
        { function: string; target: string },
        { target: string; ticker: string; balance: number }
      >({ function: 'balance', target: owner })
    ).result?.balance;

    expect(balance).toEqual(210);
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
      await contract.viewState<{ function: string; id: string }, { counter: { messages: number; reactions: number } }>({
        function: 'getCounter',
        id: 'asia',
      })
    ).result?.counter;
    expect(counter.messages).toEqual(1);
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
      await contract.viewState<{ function: string; id: string }, { counter: { messages: number; reactions: number } }>({
        function: 'getCounter',
        id: 'asia',
      })
    ).result?.counter;
    expect(counter.reactions).toEqual(0);
  });

  it('should throw when trying to delet non-existing message', async () => {
    await expect(
      contract.writeInteraction({ function: 'removeMessage', id: 'asia', messageId: '99' }, { strict: true })
    ).rejects.toThrow(`Message not found.`);
  });
});
