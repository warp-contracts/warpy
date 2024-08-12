import { SlashCommandBuilder } from 'discord.js';
import { isEthWallet, getStateFromDre, connectToServerContract, warpyIconUrl, getSonarInteractionUrl } from '../utils';
import { Warp, WriteInteractionResponse } from 'warp-contracts';

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

    let address: string | undefined;
    try {
      address = (await getStateFromDre(contract.txId(), 'users', userId)).result;
    } catch (e) {
      await interaction.editReply({ content: `Could not load state from D.R.E. nodes.`, ephemeral: true });
      return;
    }

    if (address) {
      await interaction.editReply({ content: 'User already registered.', ephemeral: true });
      return null;
    }

    const { originalTxId } = (await contract.writeInteraction({
      function: 'registerUser',
      id: userId,
      address: wallet,
    })) as WriteInteractionResponse;

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
          ],
        },
      ],
      embeds: [
        {
          type: 'rich',
          description: `<@${userId}> has registered wallet address.`,
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
