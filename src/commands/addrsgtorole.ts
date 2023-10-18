import { SlashCommandBuilder } from 'discord.js';
import { connectToServerContract, getStateFromDre, warpyIconUrl } from '../utils';
import { Warp } from 'warp-contracts';

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

    let response: any;
    try {
      response = (await getStateFromDre(contract.txId())).state;
      if (!response['admins'].includes(interaction.user.id)) {
        await interaction.reply('Only admin can award RSG.');
        return;
      }
    } catch (e) {
      await interaction.reply(`Could not load state from D.R.E. nodes.`);
      return;
    }

    const rsg = interaction.options.getInteger('rsg');
    const role = interaction.options.getString('role');
    const noBoost = interaction.options.getBoolean('noboost');
    if (isNaN(Number(rsg))) {
      await interaction.reply('Incorrect number of RSG.');
      return;
    }
    const roleId = role.replace(/[<>@&]/g, '');
    await interaction.guild.members.fetch();

    const members = interaction.guild.roles.cache.get(roleId).members;
    const membersInWarpy = members
      // .filter((m: any) => Object.prototype.hasOwnProperty.call(response.users, m.id))
      .map((member: any) => ({
        id: member.user.id,
        roles: member.roles.cache.map((r: any) => r.name),
      }));
    const chunkSize = 5;
    for (let i = 0; i < membersInWarpy.length; i += chunkSize) {
      const chunk = membersInWarpy.slice(i, i + chunkSize);
      await contract.writeInteraction({
        function: 'addPoints',
        points: rsg,
        adminId: interaction.user.id,
        members: chunk,
        ...(noBoost && { noBoost }),
      });
    }

    await interaction.reply({
      content: `Role has been awarded with RSG <:RSG:1131247707017715882>.`,
      tts: true,
      components: [
        {
          type: 1,
          components: [
            // {
            //   style: 5,
            //   label: `Check out interaction`,
            //   url: `https://sonar.warp.cc/#/app/interaction/${originalTxId}?network=mainnet`,
            //   disabled: false,
            //   type: 2,
            // },
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
          description: `All users having below role have been rewarded with RSG <:RSG:1131247707017715882>.`,
          color: 0x6c8cfd,
          fields: [
            {
              name: `Role`,
              value: role,
            },
            {
              name: `RSG`,
              value: `${rsg} <:RSG:1131247707017715882>`,
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
