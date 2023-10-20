import { SlashCommandBuilder } from 'discord.js';
import { connectToServerContract, getSonarContractUrl, getStateFromDre, warpyIconUrl } from '../utils';
import { Warp } from 'warp-contracts';

export default {
  data: new SlashCommandBuilder()
    .setName('counter')
    .setDescription(`Returns number of user's RSG, messages and interactions.`),
  async execute(interaction: any, warp: Warp, wallet: any) {
    const contract = await connectToServerContract(warp, wallet, interaction.guildId);
    const contractId = contract.txId();
    const userId = interaction.user.id;

    let response;
    try {
      response = (await getStateFromDre(contractId)).state;
    } catch (e) {
      console.log(e);
      await interaction.reply(`Could not load state from D.R.E. nodes.`);
      return;
    }

    const address = response.users[userId];

    if (!address) {
      await interaction.reply('User not registered in the name service. Please ping warpy with `linkwallet` first.');
      return;
    }

    const counter: { messages: number; reactions: number; points: number } = response.counter[userId];

    await interaction.reply({
      content: `User stats.`,
      tts: true,
      components: [
        {
          type: 1,
          components: [
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
          description: `Below is shown number of messages and reactions sent by user along with total RSG collected.`,
          color: 0x6c8cfd,
          fields: [
            {
              name: `User`,
              value: `<@${userId}>`,
            },
            {
              name: `Messages`,
              value: `${counter?.messages || 0}`,
            },
            {
              name: `Reactions`,
              value: `${counter?.reactions || 0}`,
            },
            {
              name: `RSG`,
              value: `${counter?.points || 0} <:RSG:1131247707017715882>`,
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
