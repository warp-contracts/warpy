import { SlashCommandBuilder } from 'discord.js';
import { connectToServerContract, getSonarContractUrl, getStateFromDre, warpyIconUrl } from '../utils';
import { Warp } from 'warp-contracts';

export default {
  data: new SlashCommandBuilder().setName('ranking').setDescription(`Returns server's ranking.`),
  async execute(interaction: any, warp: Warp, wallet: any) {
    // interaction.channel.sendTyping();
    const contract = await connectToServerContract(warp, wallet, interaction.guildId);

    let balances;

    try {
      balances = (await getStateFromDre(contract.txId())).state.balances;
      const balancesArray: [string, number][] = Object.entries(balances);
      const balancesArraySorted = balancesArray.sort((a, b) => Number(b[1]) - Number(a[1]));
      const balancesArraySortedSliced = balancesArraySorted.slice(0, 10);

      const rankingArray: any = await Promise.all(
        balancesArraySortedSliced.map(async (b) => {
          try {
            const result = await getStateFromDre(contract.txId());
            const userId = Object.keys(result.state.users).find((key) => result.state.users[key] === b[0]);
            return { id: userId, tokens: b[1] };
          } catch (e) {
            await interaction.reply(`Could not load state from D.R.E. nodes.`);
            return null;
          }
        })
      );
      // let text = ``;
      const fields = [];
      for (let i = 0; i < rankingArray.length; i++) {
        fields.push({ name: '', value: `${i + 1}. <@${rankingArray[i].id}> - **${rankingArray[i].tokens}** tokens` });
      }
      await interaction.reply({
        content: `Warpy ranking.`,
        tts: true,
        embeds: [
          {
            type: 'rich',
            description: `Here is the list of 10 best results on this server.`,
            color: 0x6c8cfd,
            fields,
            thumbnail: {
              url: warpyIconUrl,
              height: 0,
              width: 0,
            },
            timestamp: new Date().toISOString(),
          },
        ],
      });
    } catch (e) {
      await interaction.reply(`Could not load state from D.R.E. nodes.`);
      return;
    }
    return;
  },
};
