import { SlashCommandBuilder } from 'discord.js';
import { connectToServerContract, getStateFromDre } from '../utils';
import { Warp } from 'warp-contracts';

export default {
  data: new SlashCommandBuilder()
    .setName('warpikbalance')
    .setDescription(`Returns balance for the given wallet address.`),
  async execute(interaction: any, warp: Warp, wallet: any) {
    interaction.channel.sendTyping();
    const contract = await connectToServerContract(warp, wallet, interaction.guildId);

    let address: string | [];
    try {
      address = (await getStateFromDre(contract.txId(), 'users', interaction.user.id)).result;
    } catch (e) {
      console.log(e);
      interaction.reply(`Could not load state from D.R.E. nodes.`);
      return;
    }

    if (address.length == 0) {
      interaction.reply(
        'User not registered in the name service. Please ping warpik with `warpik link wallet <wallet_id>` first.'
      );
    }

    let balance: string;
    try {
      balance = (await getStateFromDre(contract.txId(), 'balances', address as string)).result;
    } catch (e) {
      console.log(e);
      interaction.reply(`Could not load state from D.R.E. nodes.`);
      return;
    }

    interaction.reply(`You have ${balance.length > 0 ? balance : 0} tokens.`);
  },
};
