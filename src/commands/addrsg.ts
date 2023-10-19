import { GuildMember, SlashCommandBuilder } from 'discord.js';
import { connectToServerContract, getStateFromDre, warpyIconUrl } from '../utils';
import { Warp, WriteInteractionResponse } from 'warp-contracts';

export default {
  data: new SlashCommandBuilder()
    .setName('addrsg')
    .setDescription(`Add RSG to specific user (only available for admins).`)
    .addStringOption((option) => option.setName('user').setDescription('User handle.').setRequired(true))
    .addIntegerOption((option) => option.setName('rsg').setDescription('Number of RSG.').setRequired(true))
    .addBooleanOption((option) =>
      option.setName('noboost').setDescription('If true - boost will not be applied to the number of RSG.')
    ),
  async execute(interaction: any, warp: Warp, wallet: any) {
    const contract = await connectToServerContract(warp, wallet, interaction.guildId);

    try {
      const result = (await getStateFromDre(contract.txId(), 'admins')).result[0];
      if (!result.includes(interaction.user.id)) {
        await interaction.reply('Only admin can award RSG.');
        return;
      }
    } catch (e) {
      await interaction.reply(`Could not load state from D.R.E. nodes.`);
      return;
    }

    if (isNaN(Number(interaction.options.getInteger('rsg')))) {
      await interaction.reply('Incorrect number of RSG.');
      return;
    }
    const user = interaction.options.getString('user');
    const userId = user.replace(/[<>@]/g, '');
    const noBoost = interaction.options.getBoolean('noboost');
    const rsg = interaction.options.getInteger('rsg');
    interaction.guild.members.fetch(userId).then(async (member: GuildMember) => {
      const { originalTxId } = (await contract.writeInteraction({
        function: 'addPoints',
        points: rsg,
        adminId: interaction.user.id,
        members: [{ id: userId, roles: member.roles.cache.map((r: any) => r.name) }],
        ...(noBoost && { noBoost }),
      })) as WriteInteractionResponse;

      await interaction.reply({
        content: `Congrats ${user}! You have been rewarded with **RSG** <:RSG:1131247707017715882>.`,
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
            description: `Admins decided to award you with some extra RSG. Here you can find info about awarded RSG and your current balance. Check out interaction to see more details.`,
            color: 0x6c8cfd,
            fields: [
              {
                name: `RSG awarded`,
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
    });
  },
};
