import { SlashCommandBuilder } from 'discord.js';
import { getServerContractId } from '../utils';

export default {
  data: new SlashCommandBuilder().setName('warpikcontract').setDescription(`Returns server contract's link on SonAr.`),
  async execute(interaction: any) {
    const contractTxId = await getServerContractId(interaction.guildId);
    interaction.reply(`Here is the server contract: https://sonar.warp.cc/#/app/contract/${contractTxId}`);
  },
};
