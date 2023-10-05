import { SlashCommandBuilder } from 'discord.js';
import { connectToServerContract, getStateFromDre, warpikIconUrl } from '../utils';
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
      // let text = ``;
      const fields = [];
      for (let i = 0; i < rankingArray.length; i++) {
        fields.push({ name: '', value: `${i + 1}. <@${rankingArray[i].id}> - **${rankingArray[i].tokens}** tokens` });
      }
      interaction.reply({
        content: `Warpik ranking.`,
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
            description: `Here is the list of 10 best results on this server.`,
            color: 0xdd72cb,
            fields,
            thumbnail: {
              url: warpikIconUrl,
              height: 0,
              width: 0,
            },
            timestamp: new Date().toISOString(),
          },
        ],
      });
    } catch (e) {
      interaction.reply(`Could not load state from D.R.E. nodes.`);
      return;
    }
    return;
  },
};
