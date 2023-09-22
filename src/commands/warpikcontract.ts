import { SlashCommandBuilder } from 'discord.js';
import { getServerContractId, warpikIconUrl } from '../utils';

export default {
  data: new SlashCommandBuilder().setName('warpikcontract').setDescription(`Returns server contract's link on SonAr.`),
  async execute(interaction: any) {
    const contractTxId = await getServerContractId(interaction.guildId);
    interaction.reply({
      content: `Warpik server's contract.`,
      tts: true,
      components: [
        {
          type: 1,
          components: [
            {
              style: 5,
              label: `Check out contract`,
              url: `https://sonar.warp.cc/#/app/contract/${contractTxId}`,
              disabled: false,
              type: 2,
            },
          ],
        },
      ],
      embeds: [
        {
          type: 'rich',
          description: `Click the link to view this server's contract info, all the interactions and current state.`,
          color: 0xdd72cb,
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
