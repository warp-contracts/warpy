import { SlashCommandBuilder } from 'discord.js';
import {
  connectToServerContract,
  getSonarContractUrl,
  getSonarInteractionUrl,
  getStateFromDre,
  warpyIconUrl,
} from '../utils';
import { Warp, WriteInteractionResponse } from 'warp-contracts';

export default {
  data: new SlashCommandBuilder()
    .setName('addroleseason')
    .setDescription(`Set role season for specific timestamps (only available for admins).`)
    .addStringOption((option) => option.setName('name').setDescription('Role season name.').setRequired(true))
    .addIntegerOption((option) =>
      option.setName('from').setDescription('From timestamp in milliseconds.').setRequired(true)
    )
    .addIntegerOption((option) =>
      option.setName('to').setDescription('To timestamp in milliseconds.').setRequired(true)
    )
    .addStringOption((option) =>
      option.setName('boostname').setDescription('Name of the season boost.').setRequired(true)
    )
    .addIntegerOption((option) =>
      option.setName('boostvalue').setDescription('Value of the season boost.').setRequired(true)
    )
    .addStringOption((option) =>
      option.setName('role').setDescription('Name of the role assigned to season.').setRequired(true)
    ),
  async execute(interaction: any, warp: Warp, wallet: any) {
    const contract = await connectToServerContract(warp, wallet, interaction.guildId);

    try {
      const result = (await getStateFromDre(contract.txId(), 'admins')).result[0];
      if (!result.includes(interaction.user.id)) {
        await interaction.reply('Only admin can set role season.');
        return;
      }
    } catch (e) {
      await interaction.reply(`Could not load state from D.R.E. nodes.`);
      return;
    }

    const name = interaction.options.getString('name');
    const boost = interaction.options.getString('boostname');
    const from = interaction.options.getInteger('from');
    const to = interaction.options.getInteger('to');
    const boostValue = interaction.options.getInteger('boostvalue');
    const roleId = interaction.options.getString('role');
    const role = interaction.guild.roles.cache.find((r: any) => r.id == roleId.replace(/[<>@&]/g, '')).name;
    const adminId = interaction.user.id;

    if (isNaN(Number(boostValue))) {
      await interaction.reply('Incorrect boost value.');
      return;
    }
    const { originalTxId } = (await contract.writeInteraction({
      function: 'addSeasonToRole',
      name,
      from,
      to,
      boost,
      boostValue,
      role,
      adminId,
    })) as WriteInteractionResponse;

    await interaction.reply({
      content: `Role season added.`,
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
          description: `New role season: **${name}** for role: **${roleId}** has been set.`,
          color: 0x6c8cfd,
          fields: [
            {
              name: `Boost`,
              value: boost,
            },
            {
              name: `Boost value`,
              value: boostValue,
            },
            {
              name: `From`,
              value: `<t:${from}>`,
            },
            {
              name: `To`,
              value: `<t:${to}>`,
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
