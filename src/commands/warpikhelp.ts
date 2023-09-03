import { SlashCommandBuilder } from 'discord.js';

export default {
  data: new SlashCommandBuilder().setName('warpikhelp').setDescription(`Displays list of possible commands.`),
  async execute(interaction: any) {
    interaction.channel.sendTyping();
    interaction.reply(`Hey, my name is Warpik. Here is the list of commands you can use to interact with me:
    \n💼 **/warpiklinkwallet <wallet_id>** - link you wallet address to start receiving tokens for your activity
    \n💰 **/warpikbalance** - check your tokens balance
    \n📊 **/warpikcounter** - check number of the messages and reactions you've sent so far
    \n📃 **/warpikcontract** - get link to this server's warpik contract
    \n📉 **/warpikranking** - display current server's ranking
    \n💁🏼 **/warpikhelp** - show warpik commands
    \n☝🏻 **/warpikaddpoints** - add points to specific user (only available for admins)
    `);
  },
};
