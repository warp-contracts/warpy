import { ChatInputCommandInteraction, CommandInteraction, GuildMember, Role, SlashCommandBuilder } from 'discord.js';
import { connectToServerContract, getSonarInteractionUrl, warpyIconUrl } from '../utils';
import { Warp, WriteInteractionResponse } from 'warp-contracts';
import { backOff } from 'exponential-backoff';
import { limitTransactionsPerTimeLag } from '../events/messageReactionAdd';
import { TransactionsPerTimeLag } from '../types/discord';

const txs: TransactionsPerTimeLag = {};
const ROULETTE_TXS_LIMIT = 1;
const ROULETTE_TIMELAG = 86400;

export default {
  data: new SlashCommandBuilder().setName('roulette').setDescription(`Welcome to the Warpy Christmas Roulette!`),
  async execute(interaction: ChatInputCommandInteraction, warp: Warp, wallet: any) {
    await interaction.deferReply();
    const userId = interaction.user.id;

    if (
      !limitTransactionsPerTimeLag(
        txs,
        userId,
        Date.now(),
        `${interaction.id}`,
        ROULETTE_TXS_LIMIT,
        'roulette',
        ROULETTE_TIMELAG
      )
    ) {
      await interaction.editReply(`User already rewarded. Please come back tomorrow :christmas_tree:`);
      return;
    }

    const contract = await connectToServerContract(warp, wallet, interaction.guildId);
    const contractId = contract.txId();

    let response;
    try {
      response = await fetch(`https://dre-warpy.warp.cc/warpy/user-balance?userId=${userId}`).then((res) => {
        return res.json();
      });
    } catch (e) {
      await interaction.editReply(`Could not load state from D.R.E. nodes.`);
      return;
    }

    const address = response[0]?.wallet_address;

    if (!address) {
      await interaction.editReply(
        `User not registered in the name service. Please ping warpy with 'linkwallet' first.`
      );
      return;
    }

    let rouletteOn: boolean;
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

    if (!rouletteOn) {
      await interaction.editReply('Roulette is not switched on.');
      return;
    }

    interaction.guild?.members.fetch(userId).then(async (member: GuildMember) => {
      const { originalTxId } = (await contract.writeInteraction(
        {
          function: 'playRoulette',
          userId,
          interactionId: interaction.id,
          roles: member.roles.cache.map((r: Role) => r.name),
        },
        { vrf: true }
      )) as WriteInteractionResponse;
      console.log(`Send interaction to Warpy, interaction id: ${originalTxId}, userId: ${userId}`);

      let rouletteResult;

      const request = async () => {
        return fetch(`https://dre-warpy.warp.cc/warpy/roulette-pick?interactionId=${originalTxId}`).then((res) => {
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
        await interaction.editReply(`User already rewarded. Please come back tomorrow :christmas_tree:`);
        return;
      }

      await interaction.editReply({
        content: `Ho ho ho :gift: <@${userId}>! You won **RSG** <:RSG:1131247707017715882>.`,
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
            description: ``,
            color: 0x6c8cfd,
            fields: [
              {
                name: `RSG awarded`,
                value: `${rouletteResult.result[0].pick} <:RSG:1131247707017715882>`,
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
