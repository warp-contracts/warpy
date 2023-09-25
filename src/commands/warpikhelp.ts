import { SlashCommandBuilder } from 'discord.js';
import { warpikIconUrl } from '../utils';

export default {
  data: new SlashCommandBuilder().setName('warpikhelp').setDescription(`Displays list of possible commands.`),
  async execute(interaction: any) {
    interaction.channel.sendTyping();

    interaction.reply({
      content: `Warpik commands.`,
      tts: true,
      embeds: [
        {
          type: 'rich',
          description: `All commands that can be sent to Warpik.`,
          color: 0xdd72cb,
          fields: [
            {
              name: `💼 **/warpiklinkwallet**`,
              value: `link you wallet address to start receiving tokens for your activity`,
            },
            {
              name: `💰 **/warpikbalance**`,
              value: `check your tokens balance`,
            },
            {
              name: `📊 **/warpikcounter**`,
              value: `check number of the messages and reactions you've sent so far`,
            },
            {
              name: `📃 **/warpikcontract**`,
              value: `get link to this server's warpik contract`,
            },
            {
              name: `🏋🏼‍♂️ **/warpikaddrsg**`,
              value: `add RSG to specific user (only available for admins)`,
            },
            {
              name: `🚴🏼‍♀️ **/warpikaddrsgtorole**`,
              value: `add RSG to specific role (only available for admins)`,
            },
            {
              name: `🤸🏼‍♀️ **/warpikaddroleseason**`,
              value: `set new season for role (only available for admins)`,
            },
            {
              name: `📉 **/warpikranking**`,
              value: `display current server's ranking`,
            },
            {
              name: `💁🏼 **/warpikhelp**`,
              value: `show warpik commands`,
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
