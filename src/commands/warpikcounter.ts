import { SlashCommandBuilder } from 'discord.js';
import { connectToServerContract, getStateFromDre } from '../utils';
import { Warp } from 'warp-contracts';

export default {
  data: new SlashCommandBuilder()
    .setName('warpikcounter')
    .setDescription(`Returns number of user's points, messages and interactions.`),
  async execute(interaction: any, warp: Warp, wallet: any) {
    interaction.channel.sendTyping();
    const contract = await connectToServerContract(warp, wallet, interaction.guildId);

    let result: { messages: number; reactions: number; points: number }[];
    try {
      result = (await getStateFromDre(contract.txId(), 'counter', interaction.user.id)).result;
    } catch (e) {
      interaction.reply(`Could not load state from D.R.E. nodes.`);
      return;
    }
    console.log(result[0]);
    interaction.reply(
      `You have sent ${result[0].messages || 0} messages and ${result[0].reactions || 0} reactions. You have ${
        result[0].points
      } points.`
    );
  },
};
