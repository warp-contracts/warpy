import { SlashCommandBuilder } from 'discord.js';
import { connectToServerContract, getStateFromDre, warpikIconUrl } from '../utils';
import { Warp, WriteInteractionResponse } from 'warp-contracts';

export default {
  data: new SlashCommandBuilder()
    .setName('warpikaddroleseason')
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
        interaction.reply('Only admin can set role season.');
        return;
      }
    } catch (e) {
      interaction.reply(`Could not load state from D.R.E. nodes.`);
      return;
    }

    const name = interaction.options.getString('name');
    const boost = interaction.options.getString('boostname');
    const from = interaction.options.getInteger('from');
    const to = interaction.options.getInteger('to');
    const boostValue = interaction.options.getInteger('boostvalue');
    const role = interaction.options.getString('role');

    if (isNaN(Number(boostValue))) {
      interaction.reply('Incorrect boost value.');
    }
    const { originalTxId } = (await contract.writeInteraction({
      function: 'addSeasonToRole',
      name,
      from,
      to,
      boost,
      boostValue,
      role,
    })) as WriteInteractionResponse;

    interaction.reply({
      content: `Role season added.`,
      tts: true,
      components: [
        {
          type: 1,
          components: [
            {
              style: 5,
              label: `Check out interaction`,
              url: `https://sonar.warp.cc/#/app/interaction/${originalTxId}?network=mainnet`,
              disabled: false,
              type: 2,
            },
            {
              style: 5,
              label: `Check out contract state`,
              url: `https://sonar.warp.cc/#/app/contract/${contract.txId()}?network=mainnet#current-state`,
              disabled: false,
              type: 2,
            },
          ],
        },
      ],
      embeds: [
        {
          type: 'rich',
          description: `New role season: **${name}** for role: **${role}** has been set.`,
          color: 0xdd72cb,
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
              value: new Date(from * 1000).toLocaleString(),
            },
            {
              name: `To`,
              value: new Date(to * 1000).toLocaleString(),
            },
          ],
          thumbnail: {
            url: warpikIconUrl,
            height: 0,
            width: 0,
          },
          timestamp: new Date().toISOString(),
        },
      ],
    });
  },
};
