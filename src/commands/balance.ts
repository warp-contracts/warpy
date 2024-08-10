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

    let address: string | undefined;
    let balance: number | null;

    address = response[0].wallet_address;

    if (!address) {
      try {
        address = (await getStateFromDre(contract.txId(), 'users', userId))?.result;
      } catch (e) {
        await interaction.editReply({ content: `Could not load state from D.R.E. nodes.`, ephemeral: true });
        return;
      }
      if (!address) {
        await interaction.editReply(
          `User not registered in the name service. Please ping warpy with 'linkwallet' first.`
        );
        return;
      }
      balance = null;
    } else {
      balance = response[0].balance;
    }

    await interaction.editReply({
      content: `User's tokens balance.`,
      tts: true,
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
