import { GuildMember, Role, SlashCommandBuilder } from 'discord.js';
import {
  connectToServerContract,
  getSonarContractUrl,
  getSonarInteractionUrl,
  getStateFromDre,
  warpyIconUrl,
} from '../utils';
import { Warp, WriteInteractionResponse } from 'warp-contracts';
import { backOff } from 'exponential-backoff';

export default {
  data: new SlashCommandBuilder()
    .setName('roulette')
    .setDescription(`Play roulette (in order to play the game Warpy will charge you with 500 RSG:RSG: fee.`),
  async execute(interaction: any, warp: Warp, wallet: any) {
    await interaction.deferReply();

    const contract = await connectToServerContract(warp, wallet, interaction.guildId);
    const contractId = contract.txId();
    const userId = interaction.user.id;
    let response;
    try {
      response = (await getStateFromDre(contractId)).state;
    } catch (e) {
      console.log(e);
      await interaction.editReply(`Could not load state from D.R.E. nodes.`);
      return;
    }
    if (!response['users'][userId]) {
      await interaction.editReply(
        'User not registered in the name service. Please ping warpy with `linkwallet` first.'
      );
      return;
    }

    if (!response.rouletteOn) {
      await interaction.editReply('Roulette is not switched on.');
      return;
    }

    if (!response.counter[userId] || response.counter[userId].points < response.rouletteEntry) {
      await interaction.editReply(`User does not have enough RSG. Required balance: ${response.rouletteEntry}.`);
      return;
    }
    interaction.member.fetch().then(async (member: GuildMember) => {
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

      const request = async () => {
        return fetch(
          `https://dre-warpy.warp.cc/contract/view-state?id=${contractId}&input={"function":"getRoulettePick","userId":"${userId}","interactionId":"${interaction.id}"}`
        ).then((res) => {
          console.log(res);
          return res.ok ? res.json() : Promise.reject(res);
        });
      };
      try {
        rouletteResult = (await backOff(request, {
          delayFirstAttempt: false,
          maxDelay: 1000,
          numOfAttempts: 5,
        })) as any;
        console.log(rouletteResult);
      } catch (error: any) {
        console.log(error);
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
