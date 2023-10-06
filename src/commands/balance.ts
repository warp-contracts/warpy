import { SlashCommandBuilder } from 'discord.js';
import { connectToServerContract, getStateFromDre, warpyIconUrl } from '../utils';
import { Warp } from 'warp-contracts';

export default {
  data: new SlashCommandBuilder().setName('balance').setDescription(`Returns balance for the given wallet address.`),
  async execute(interaction: any, warp: Warp, wallet: any) {
    interaction.channel.sendTyping();
    const contract = await connectToServerContract(warp, wallet, interaction.guildId);

    let address: string | [];
    const userId = interaction.user.id;
    try {
      address = (await getStateFromDre(contract.txId(), 'users', userId)).result;
    } catch (e) {
      console.log(e);
      await interaction.reply(`Could not load state from D.R.E. nodes.`);
      return;
    }

    if (address.length == 0) {
      await interaction.reply('User not registered in the name service. Please ping warpy with `linkwallet` first.');
    }

    let balance: string;
    try {
      balance = (await getStateFromDre(contract.txId(), 'balances', address as string)).result;
    } catch (e) {
      console.log(e);
      await interaction.reply(`Could not load state from D.R.E. nodes.`);
      return;
    }

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
          color: 0xdd72cb,
          fields: [
            {
              name: `User`,
              value: `<@${userId}>`,
            },
            {
              name: `Tokens balance`,
              value: `${balance.length > 0 ? balance : 0}`,
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
