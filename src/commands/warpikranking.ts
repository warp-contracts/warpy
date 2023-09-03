import { SlashCommandBuilder } from 'discord.js';
import { connectToServerContract, getStateFromDre } from '../utils';
import { Warp } from 'warp-contracts';

export default {
  data: new SlashCommandBuilder().setName('warpikranking').setDescription(`Returns server's ranking.`),
  async execute(interaction: any, warp: Warp, wallet: any) {
    interaction.channel.sendTyping();
    const contract = await connectToServerContract(warp, wallet, interaction.guildId);

    let balances;

    try {
      balances = (await getStateFromDre(contract.txId())).state.balances;
      const balancesArray: [string, number][] = Object.entries(balances);
      const balancesSorted = balancesArray.sort((a, b) => b[1] - a[1]).slice(0 - 9);

      const rankingArray: any = await Promise.all(
        balancesSorted.map(async (b) => {
          try {
            const result = await getStateFromDre(contract.txId());
            const userId = Object.keys(result.state.users).find((key) => result.state.users[key] === b[0]);
            return { id: userId, tokens: b[1] };
          } catch (e) {
            interaction.reply(`Could not load state from D.R.E. nodes.`);
            return null;
          }
        })
      );
      let text = ``;
      for (let i = 0; i < rankingArray.length; i++) {
        text += `${i + 1}. <@${rankingArray[i].id}> - ${rankingArray[i].tokens} tokens\n`;
      }
      interaction.reply(text);
    } catch (e) {
      interaction.reply(`Could not load state from D.R.E. nodes.`);
      return;
    }
    return;
  },
};
