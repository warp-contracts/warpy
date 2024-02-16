import { SlashCommandBuilder } from 'discord.js';
import {
  isEthWallet,
  getStateFromDre,
  connectToServerContract,
  warpyIconUrl,
  getSonarInteractionUrl,
  getSonarContractUrl,
  DRE_WARPY,
} from '../utils';
import { Tag, Warp, WriteInteractionResponse } from 'warp-contracts';

export default {
  data: new SlashCommandBuilder()
    .setName('changewallet')
    .setDescription('Changes ETH wallet linked to the discord account.')
    .addStringOption((option) =>
      option.setName('address').setDescription('Your ETH wallet address.').setRequired(true)
    ),
  async execute(interaction: any, warp: Warp, warpWallet: any) {
    await interaction.deferReply();
    const contract = await connectToServerContract(warp, warpWallet, interaction.guildId);
    const wallet = interaction.options.getString('address');
    const userId = interaction.user.id;
    if (!isEthWallet(wallet)) {
      await interaction.editReply({ content: 'Wallet address is not valid.', ephemeral: true });
      return null;
    }

    let user: string | [];
    try {
      user = (await getStateFromDre(contract.txId(), 'users', userId)).result;
    } catch (e) {
      await interaction.editReply({ content: `Could not load state from D.R.E. nodes.`, ephemeral: true });
      return;
    }

    if (user.length == 0) {
      await interaction.editReply({ content: 'User not registered. Please use /linkwallet command.', ephemeral: true });
      return null;
    }

    let addressResult: { [key: string]: string }[] | [];
    try {
      addressResult = await fetch(`${DRE_WARPY}/warpy/user-id?address=${wallet}`).then((res) => res.json());
    } catch (e) {
      await interaction.editReply({ content: `Could not load state from D.R.E. nodes.`, ephemeral: true });
      return;
    }

    if (addressResult.length > 0) {
      await interaction.editReply({ content: 'Address already assigned.', ephemeral: true });
      return null;
    }

    const { originalTxId } = (await contract.writeInteraction({
      function: 'changeWallet',
      id: userId,
      address: wallet,
    })) as WriteInteractionResponse;

    await interaction.editReply({
      content: `Wallet address changed correctly.`,
      tts: true,
      components: [
        {
          type: 1,
          components: [
            {
              style: 5,
              label: `Check out interaction`,
              url: getSonarInteractionUrl(originalTxId),
              disabled: false,
              type: 2,
            },
            {
              style: 5,
              label: `Check out contract state`,
              url: getSonarContractUrl(contract.txId(), true),
              disabled: false,
              type: 2,
            },
          ],
        },
      ],
      embeds: [
        {
          type: 'rich',
          description: `<@${userId}> has changed wallet address.`,
          color: 0x6c8cfd,
          thumbnail: {
            url: warpyIconUrl,
            height: 0,
            width: 0,
          },
          timestamp: new Date().toISOString(),
        },
      ],
      ephemeral: true,
    });
  },
};
