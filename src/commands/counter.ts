import { SlashCommandBuilder } from 'discord.js';
import { connectToServerContract, getStateFromDre, warpyIconUrl } from '../utils';
import { Warp } from 'warp-contracts';

export default {
  data: new SlashCommandBuilder()
    .setName('counter')
    .setDescription(`Returns number of user's RSG, messages and interactions.`),
  async execute(interaction: any, warp: Warp, wallet: any) {
    interaction.channel.sendTyping();
    const contract = await connectToServerContract(warp, wallet, interaction.guildId);
    const userId = interaction.user.id;
    let address: string | [];
    try {
      address = (await getStateFromDre(contract.txId(), 'users', userId)).result;
    } catch (e) {
      console.log(e);
      interaction.reply(`Could not load state from D.R.E. nodes.`);
      return;
    }

    if (address.length == 0) {
      interaction.reply('User not registered in the name service. Please ping warpy with `linkwallet` first.');
    }

    let result: { messages: number; reactions: number; points: number }[];
    try {
      result = (await getStateFromDre(contract.txId(), 'counter', userId)).result;
    } catch (e) {
      interaction.reply(`Could not load state from D.R.E. nodes.`);
      return;
    }

    interaction.reply({
      content: `User stats.`,
      tts: true,
      components: [
        {
          type: 1,
          components: [
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
          description: `Below is shown number of messages and reactions sent by user along with total RSG collected.`,
          color: 0xdd72cb,
          fields: [
            {
              name: `User`,
              value: `<@${userId}>`,
            },
            {
              name: `Messages`,
              value: `${result[0].messages || 0}`,
            },
            {
              name: `Reactions`,
              value: `${result[0].reactions || 0}`,
            },
            {
              name: `RSG`,
              value: `${result[0].points} :RSG:`,
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
