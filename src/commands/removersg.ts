import { SlashCommandBuilder } from 'discord.js';
import { connectToServerContract, getStateFromDre, warpyIconUrl } from '../utils';
import { Warp, WriteInteractionResponse } from 'warp-contracts';

export default {
  data: new SlashCommandBuilder()
    .setName('removersg')
    .setDescription(`Remove specific user's RSG (only available for admins).`)
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
        await interaction.reply();
        return;
      }
    } catch (e) {
      await interaction.reply(`Could not load state from D.R.E. nodes.`);
      return;
    }

    const rsg = interaction.options.getInteger('rsg');
    if (isNaN(Number(rsg))) {
      await interaction.reply('Incorrect number of RSG.');
    }
    const adminId = interaction.user.id;
    const user = interaction.options.getString('user');
    const userId = user.replace(/[<>@]/g, '');
    const noBoost = interaction.options.getBoolean('noboost');

    const { originalTxId } = (await contract.writeInteraction({
      function: 'removePoints',
      members: [{ id: userId, roles: interaction.member.roles.cache.map((r: any) => r.name) }],
      points: rsg,
      adminId,
      ...(noBoost && { noBoost }),
    })) as WriteInteractionResponse;

    const counter = (
      await contract.viewState<
        { function: string; id: string },
        { counter: { messages: number; reactions: number; points: number } }
      >({
        function: 'getCounter',
        id: userId,
      })
    ).result?.counter;

    await interaction.reply({
      content: `RSG have been subtracted from ${user} balance.`,
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
          description: `Admins decided to subtract some RSG from your balance.`,
          color: 0xdd72cb,
          fields: [
            {
              name: `RSG subtracted`,
              value: `${rsg} <:RSG:1159789917107400765>`,
            },
            {
              name: 'Current RSG balance',
              value: `${counter.points} <:RSG:1159789917107400765>`,
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
