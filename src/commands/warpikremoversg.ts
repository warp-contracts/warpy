import { SlashCommandBuilder } from 'discord.js';
import { connectToServerContract, getStateFromDre, warpikIconUrl } from '../utils';
import { Warp, WriteInteractionResponse } from 'warp-contracts';

export default {
  data: new SlashCommandBuilder()
    .setName('warpikremoversg')
    .setDescription(`Remove specific user's RSG (only available for admins).`)
    .addStringOption((option) => option.setName('user').setDescription('User handle.').setRequired(true))
    .addIntegerOption((option) => option.setName('rsg').setDescription('Number of RSG.').setRequired(true)),
  async execute(interaction: any, warp: Warp, wallet: any) {
    const contract = await connectToServerContract(warp, wallet, interaction.guildId);

    try {
      const result = (await getStateFromDre(contract.txId(), 'admins')).result[0];
      if (!result.includes(interaction.user.id)) {
        interaction.reply();
        return;
      }
    } catch (e) {
      interaction.reply(`Could not load state from D.R.E. nodes.`);
      return;
    }

    const rsg = interaction.options.getInteger('rsg');
    if (isNaN(Number(rsg))) {
      interaction.reply('Incorrect number of RSG.');
    }
    const adminId = interaction.user.id;
    const user = interaction.options.getString('user');
    const userId = user.replace(/[<>@]/g, '');
    const { originalTxId } = (await contract.writeInteraction({
      function: 'removePoints',
      members: [{ id: userId, roles: interaction.member.roles.cache.map((r: any) => r.name) }],
      points: rsg,
      adminId,
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

    interaction.reply({
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
              value: `${rsg} :RSG:`,
            },
            {
              name: 'Current RSG balance',
              value: `${counter.points} :RSG:`,
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
