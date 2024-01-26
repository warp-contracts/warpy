import { SlashCommandBuilder } from 'discord.js';
import { connectToServerContract, getSonarContractUrl, getStateFromDre, warpyIconUrl } from '../utils';
import { Warp } from 'warp-contracts';

export default {
  data: new SlashCommandBuilder().setName('balance').setDescription(`Returns balance for the given wallet address.`),
  async execute(interaction: any, warp: Warp, wallet: any) {
    await interaction.deferReply();
    const contract = await connectToServerContract(warp, wallet, interaction.guildId);
    const contractId = contract.txId();

    const userId = interaction.user.id;

    let response;
    try {
      response = await fetch(`https://dre-warpy.warp.cc/warpy/user-balance?userId=${userId}`).then((res) => {
        return res.json();
      });
    } catch (e) {
      await interaction.editReply(`Could not load state from D.R.E. nodes.`);
      return;
    }

    const address = response[0].wallet_address;

    if (!address) {
      await interaction.editReply(
        'User not registered in the name service. Please ping warpy with `linkwallet` first.'
      );
      return;
    }

    const balance = response[0].balance;

    await interaction.editReply({
      content: `User's tokens balance.`,
      tts: true,
      components: [
        {
          type: 1,
          components: [
            {
              style: 5,
              label: `Check out contract state`,
              url: getSonarContractUrl(contractId, true),
              disabled: false,
              type: 2,
            },
          ],
        },
      ],
      embeds: [
        {
          type: 'rich',
          color: 0x6c8cfd,
          fields: [
            {
              name: `User`,
              value: `<@${userId}>`,
            },
            {
              name: `Tokens balance`,
              value: `${balance || 0}`,
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
    });
  },
};
