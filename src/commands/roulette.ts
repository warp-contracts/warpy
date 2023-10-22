import { GuildMember, Role, SlashCommandBuilder } from 'discord.js';
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
    .setName('roulette')
    .setDescription(`Play roulette (in order to play the game Warpy will charge you with 500 RSG:RSG: fee.`),
  async execute(interaction: any, warp: Warp, wallet: any) {
    await interaction.deferReply({ ephemeral: true });

    const contract = await connectToServerContract(warp, wallet, interaction.guildId);
    const contractId = contract.txId();
    const userId = interaction.user.id;

    let response;
    try {
      response = (await getStateFromDre(contractId)).state;
    } catch (e) {
      console.log(e);
      await interaction.reply(`Could not load state from D.R.E. nodes.`);
      return;
    }
    if (!response['users'][userId]) {
      await interaction.reply('User not registered in the name service. Please ping warpy with `linkwallet` first.');
      return;
    }

    if (!response.rouletteOn) {
      await interaction.reply('Roulette is not switched on.');
      return;
    }

    if (!response.counter[userId] || response.counter[userId].points < response.rouletteEntry) {
      await interaction.reply(`User does not have enough RSG. Required balance: ${response.rouletteEntry}.`);
      return;
    }
    interaction.member.fetch().then(async (member: GuildMember) => {
      console.log(member);
      const { originalTxId } = (await contract.writeInteraction(
        {
          function: 'playRoulette',
          userId,
          interactionId: interaction.id,
          roles: member.roles.cache.map((r: Role) => r.name),
        },
        { vrf: true }
      )) as WriteInteractionResponse;

      let rouletteResult;
      try {
        rouletteResult = await fetch(
          `https://dre-2.warp.cc/contract/view-state?id=${contractId}&input={"function":"getRoulettePick","userId":"${userId}","interactionId":"${interaction.id}"}`
        ).then((res) => res.json());
      } catch (e) {
        console.log(e);
      }

      await interaction.editReply({
        content: `Congrats <@${userId}>! You won **RSG** <:RSG:1131247707017715882>.`,
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
            description: ``,
            color: 0x6c8cfd,
            fields: [
              {
                name: `RSG awarded`,
                value: `${rouletteResult.result.pick} <:RSG:1131247707017715882>`,
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
    });
  },
};
