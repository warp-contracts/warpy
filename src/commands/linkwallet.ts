import { SlashCommandBuilder } from 'discord.js';
import {
  isEthWallet,
  getStateFromDre,
  connectToServerContract,
  warpyIconUrl,
  getSonarInteractionUrl,
  getSonarContractUrl,
} from '../utils';
import { Tag, Warp, WriteInteractionResponse } from 'warp-contracts';

export default {
  data: new SlashCommandBuilder()
    .setName('linkwallet')
    .setDescription('Links ETH wallet to the discord account.')
    .addStringOption((option) =>
      option.setName('address').setDescription('Your ETH wallet address.').setRequired(true)
    ),
  async execute(interaction: any, warp: Warp, warpWallet: any) {
    await interaction.deferReply();
    const contract = await connectToServerContract(warp, warpWallet, interaction.guildId);
    // interaction.channel.sendTyping();

    const wallet = interaction.options.getString('address');
    const userId = interaction.user.id;
    if (!isEthWallet(wallet)) {
      await interaction.editReply({ content: 'Wallet address is not valid.', ephemeral: true });
      return null;
    }

    let address: string | [];
    try {
      address = (await getStateFromDre(contract.txId(), 'users', userId)).result;
    } catch (e) {
      await interaction.editReply({ content: `Could not load state from D.R.E. nodes.`, ephemeral: true });
      return;
    }

    if (address.length > 0) {
      await interaction.editReply({ content: 'User already registered.', ephemeral: true });
      return null;
    }

    const { originalTxId } = (await contract.writeInteraction({
      function: 'registerUser',
      id: userId,
      address: wallet,
    })) as WriteInteractionResponse;

    let result: { interactions: number; reactions: number }[];

    try {
      result = (await getStateFromDre(contract.txId(), 'counter', userId)).result;
    } catch (e) {
      await interaction.editReply({ content: `Could not load state from D.R.E. nodes.`, ephemeral: true });
      return;
    }

    if (result.length > 0) {
      await contract.writeInteraction(
        { function: 'mint', id: userId },
        {
          tags: [new Tag('Indexed-By', `mint;${userId};${interaction.guildId};`)],
        }
      );
    }

    await interaction.editReply({
      content: `User registered correctly.`,
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
          description: `<@${userId}> has registered wallet address.`,
          color: 0x6c8cfd,
          fields: [
            {
              name: `Wallet address`,
              value: wallet,
            },
          ],
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
