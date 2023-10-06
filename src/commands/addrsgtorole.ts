import { SlashCommandBuilder } from 'discord.js';
import { connectToServerContract, getStateFromDre, warpyIconUrl } from '../utils';
import { Warp, WriteInteractionResponse } from 'warp-contracts';

export default {
  data: new SlashCommandBuilder()
    .setName('addrsgtorole')
    .setDescription(`Add RSG to specific role (only available for admins).`)
    .addStringOption((option) =>
      option.setName('role').setDescription('Role which members will be awarded with RSG.').setRequired(true)
    )
    .addIntegerOption((option) => option.setName('rsg').setDescription('Number of RSG.').setRequired(true))
    .addBooleanOption((option) =>
      option.setName('noboost').setDescription('If true - boost will not be applied to the number of RSG.')
    ),
  async execute(interaction: any, warp: Warp, wallet: any) {
    const contract = await connectToServerContract(warp, wallet, interaction.guildId);

    try {
      const result = (await getStateFromDre(contract.txId(), 'admins')).result[0];
      if (!result.includes(interaction.user.id)) {
        interaction.reply('Only admin can award RSG.');
        return;
      }
    } catch (e) {
      interaction.reply(`Could not load state from D.R.E. nodes.`);
      return;
    }

    const rsg = interaction.options.getInteger('rsg');
    const role = interaction.options.getString('role');
    if (isNaN(Number(rsg))) {
      interaction.reply('Incorrect number of RSG.');
    }
    const roleManager = interaction.guild.roles.cache.find((r: any) => r.name === role);
    const members = roleManager.members.map((member: any) => ({
      id: member.user.id,
      roles: member.roles.cache.map((r: any) => r.name),
    }));
    const noBoost = interaction.options.getBoolean('noboost');
    const { originalTxId } = (await contract.writeInteraction({
      function: 'addPoints',
      points: rsg,
      adminId: interaction.user.id,
      members,
      ...(noBoost && { noBoost }),
    })) as WriteInteractionResponse;

    interaction.reply({
      content: `Role has been awarded with RSG :RSG:.`,
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
          description: `All users having below role have been rewarded with RSG :RSG:.`,
          color: 0xdd72cb,
          fields: [
            {
              name: `Role`,
              value: role,
            },
            {
              name: `RSG`,
              value: `${rsg} :RSG:`,
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
