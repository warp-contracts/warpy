import { SlashCommandBuilder } from 'discord.js';
import { connectToServerContract, getSonarInteractionUrl, getStateFromDre, sleep, warpyIconUrl } from '../utils';
import { Warp, WriteInteractionResponse } from 'warp-contracts';

export default {
  data: new SlashCommandBuilder()
    .setName('switchroulette')
    .setDescription(`Switch on/off roulette (only available for admins).`),
  async execute(interaction: any, warp: Warp, wallet: any) {
    await interaction.deferReply();

    const contract = await connectToServerContract(warp, wallet, interaction.guildId);
    const contractId = contract.txId();

    try {
      const result = (await getStateFromDre(contractId, 'admins')).result;
      if (!result.includes(interaction.user.id)) {
        await interaction.editReply('Only admin can switch roulette.');
        return;
      }
    } catch (e) {
      await interaction.editReply(`Could not load state from D.R.E. nodes.`);
      return;
    }

    const { originalTxId } = (await contract.writeInteraction({
      function: 'switchRoulette',
      adminId: interaction.user.id,
    })) as WriteInteractionResponse;

    await sleep(5000);
    let rouletteOn;
    try {
      rouletteOn = (
        await fetch(`https://dre-warpy.warp.cc/contract?id=${contractId}&query=$.rouletteOn`).then((res) => {
          return res.json();
        })
      ).result[0];
    } catch (e) {
      await interaction.editReply(`Could not load state from D.R.E. nodes.`);
      return;
    }
    await interaction.editReply({
      content: `**Warpy Christmas Roulette** :ferris_wheel: is now ${rouletteOn ? '**ON**' : '**OFF**'}!`,
      tts: true,
      components: [
        {
          type: 1,
          components: [
            {
              style: 5,
              label: `Check out interaction`,
              url: getSonarInteractionUrl(originalTxId),
              disabled: false,
              type: 2,
            },
          ],
        },
      ],
      embeds: [
        {
          type: 'rich',
          description: `${
            rouletteOn
              ? `Admins just started Warpy Christmas  Roulette. Use **/roulette** method to play.`
              : `Admins just switched off Warpy Christmas Roulette. Please wait for the next openning.`
          }`,
          color: 0x6c8cfd,
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
