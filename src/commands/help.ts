import { SlashCommandBuilder } from 'discord.js';
import { warpyIconUrl } from '../utils';

export default {
  data: new SlashCommandBuilder().setName('help').setDescription(`Displays list of possible commands.`),
  async execute(interaction: any) {
    // interaction.channel.sendTyping();

    await interaction.reply({
      content: `Warpy commands.`,
      tts: true,
      embeds: [
        {
          type: 'rich',
          description: `All commands that can be sent to Warpy.`,
          color: 0x6c8cfd,
          fields: [
            {
              name: `💼 **/linkwallet**`,
              value: `link you wallet address to start receiving tokens for your activity`,
            },
            {
              name: `💰 **/balance**`,
              value: `check your tokens balance`,
            },
            {
              name: `📃 **/contract**`,
              value: `get link to this server's  contract`,
            },
            {
              name: `🏋🏼‍♂️ **/addrsg**`,
              value: `add RSG to specific user (only available for admins)`,
            },
            {
              name: `🚴🏼‍♀️ **/addrsgtorole**`,
              value: `add RSG to specific role (only available for admins)`,
            },
            {
              name: `🤸🏼‍♀️ **/addroleseason**`,
              value: `set new season for role (only available for admins)`,
            },
            {
              name: `📉 **/ranking**`,
              value: `display current server's ranking`,
            },
            {
              name: `💁🏼 **/help**`,
              value: `show  commands`,
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
