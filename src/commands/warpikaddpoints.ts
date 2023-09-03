import { SlashCommandBuilder } from 'discord.js';
import { connectToServerContract, getStateFromDre } from '../utils';
import { Warp } from 'warp-contracts';

export default {
  data: new SlashCommandBuilder()
    .setName('warpikaddpoints')
    .setDescription(`Add points to specific user (only available for admins).`)
    .addStringOption((option) => option.setName('user').setDescription('User handle.').setRequired(true))
    .addStringOption((option) => option.setName('points').setDescription('Number of points.').setRequired(true)),
  async execute(interaction: any, warp: Warp, wallet: any) {
    const contract = await connectToServerContract(warp, wallet, interaction.guildId);

    try {
      const result = (await getStateFromDre(contract.txId(), 'admins')).result[0];
      if (!result.includes(interaction.user.id)) {
        interaction.reply('Only admin can award points.');
        return;
      }
    } catch (e) {
      interaction.reply(`Could not load state from D.R.E. nodes.`);
      return;
    }

    if (isNaN(Number(interaction.options.getString('points')))) {
      interaction.reply('Incorrect number of points.');
    }
    const userId = interaction.options.getString('user').replace(/[<>@]/g, '');
    await contract.writeInteraction({
      function: 'addPoints',
      id: userId,
      points: interaction.options.getString('points'),
      adminId: interaction.user.id,
    });
    interaction.reply('Points added.');
  },
};
