import { SlashCommandBuilder } from 'discord.js';
import { isEthWallet, getStateFromDre, connectToServerContract } from '../utils';
import { Tag, Warp } from 'warp-contracts';

export default {
  data: new SlashCommandBuilder()
    .setName('warpiklinkwallet')
    .setDescription('Links ETH wallet to the discord account.')
    .addStringOption((option) =>
      option.setName('address').setDescription('Your ETH wallet address.').setRequired(true)
    ),
  async execute(interaction: any, warp: Warp, warpWallet: any) {
    const contract = await connectToServerContract(warp, warpWallet, interaction.guildId);
    interaction.channel.sendTyping();

    const wallet = interaction.options.getString('address');
    if (!isEthWallet(wallet)) {
      interaction.reply('Wallet address is not valid.');
      return null;
    }

    let address: string | [];
    try {
      address = (await getStateFromDre(contract.txId(), 'users', interaction.user.id)).result;
    } catch (e) {
      interaction.reply(`Could not load state from D.R.E. nodes.`);
      return;
    }

    if (address.length > 0) {
      interaction.reply('User already registered.');
      return null;
    }

    await contract.writeInteraction({
      function: 'registerUser',
      id: interaction.user.id,
      address: wallet,
    });

    let result: { interactions: number; reactions: number }[];
    // let balance = 0;

    try {
      result = (await getStateFromDre(contract.txId(), 'counter', interaction.user.id)).result;
    } catch (e) {
      interaction.reply(`Could not load state from D.R.E. nodes.`);
      return;
    }

    if (result.length > 0) {
      await contract.writeInteraction(
        { function: 'mint', id: interaction.user.id },
        {
          tags: [new Tag('Indexed-By', `mint;${interaction.user.id};${interaction.guildId};`)],
        }
      );

      // try {
      //   balance = (await getStateFromDre(contract.txId(), 'balances', address as string)).result[0];
      // } catch (e) {
      //   interaction.reply(`Could not load state from D.R.E. nodes.`);
      //   return null;
      // }
    }

    interaction.reply(`User registered correctly.`);
  },
};
