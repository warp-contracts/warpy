import { SlashCommandBuilder } from 'discord.js';
import {
  connectToServerContract,
  getSonarContractUrl,
  getSonarInteractionUrl,
  getStateFromDre,
  warpyIconUrl,
} from '../utils';
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

    let rouletteOn;
    try {
      rouletteOn = (
        await fetch(
          `https://dre-warpy.warp.cc/contract/view-state?id=${contractId}&input={"function":"getRouletteSwitch"}`
        ).then((res) => res.json())
      ).result.rouletteSwitch;
    } catch (e) {
      console.log(e);
    }
    await interaction.editReply({
      content: `**Warpy Roulette** :ferris_wheel: is now ${rouletteOn ? '**ON**' : '**OFF**'}!`,
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
            {
              style: 5,
              label: `Check out contract state`,
              url: getSonarContractUrl(contract.txId(), true),
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
              ? `Admins just started Warpy Roulette. In order to join the game, we will charge you 500 RSG :RSG: so be sure to check it upfront. Use **/roulette** method to play.`
              : `Admins just switched off Warpy Roulette. Please wait for the next openning.`
          }`,
          color: 0x6c8cfd,
          // fields: [
          //   {
          //     name: `:ferris-wheel:`,
          //     value: ``,
          //   },
          // ],
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
