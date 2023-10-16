import { SlashCommandBuilder } from 'discord.js';
import { connectToServerContract, getStateFromDre, warpyIconUrl } from '../utils';
import { Warp } from 'warp-contracts';

export default {
  data: new SlashCommandBuilder().setName('balance').setDescription(`Returns balance for the given wallet address.`),
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

    const balance = response.balances[address];

    await interaction.reply({
      content: `User's tokens balance.`,
      tts: true,
      components: [
        {
          type: 1,
          components: [
            {
              style: 5,
              label: `Check out contract state`,
              url: `https://sonar.warp.cc/#/app/contract/${contractId}?network=mainnet#current-state`,
              disabled: false,
              type: 2,
            },
          ],
        },
      ],
      embeds: [
        {
          type: 'rich',
          color: 0x6c8cfd,
          fields: [
            {
              name: `User`,
              value: `<@${userId}>`,
            },
            {
              name: `Tokens balance`,
              value: `${balance || 0}`,
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
