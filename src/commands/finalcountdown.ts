import { GuildMember, SlashCommandBuilder } from 'discord.js';
import { connectToServerContract, warpyIconUrl, getSonarInteractionUrl, getSonarContractUrl } from '../utils';
import { Tag, Warp, WriteInteractionResponse } from 'warp-contracts';
import { REDSTONE_SERVER_CONTRACT_ID } from '../utils';

const SEASON_3_START_TIMESTAMP = 1732575600000;
const SEASON_3_ROLE_ID = '1308736512472514570';

export default {
  data: new SlashCommandBuilder().setName('finalcountdown').setDescription('Join Season 3 of Redstone campaign.'),
  async execute(interaction: any, warp: Warp, warpWallet: any) {
    await interaction.deferReply();
    const contract = await connectToServerContract(warp, warpWallet, interaction.guildId);
    const userId = interaction.user.id;

    if (interaction.user.id != '769844280767807520' && interaction.user.id != '304935610089734150') {
      await interaction.editReply({ content: `Not available.`, ephemeral: true });
      return;
    }
    let walletAddress: string;
    try {
      walletAddress = (
        await fetch(`https://dre-warpy.warp.cc/warpy/user-balance?userId=${userId}`).then((res) => {
          return res.json();
        })
      )[0]?.wallet_address;
    } catch (e) {
      console.log(e);
      await interaction.editReply({ content: `Could not load info about user registration.`, ephemeral: true });
      return;
    }
    if (!walletAddress) {
      await interaction.editReply({ content: `User not registered in Warpy.`, ephemeral: true });
      return;
    }

    let joinSeason3Res: any;
    try {
      joinSeason3Res = await fetch(
        `https://gw.warp.cc/gateway/warpy/join-season-3?contractId=${REDSTONE_SERVER_CONTRACT_ID}&userId=${userId}&walletAddress=${walletAddress}`
      ).then((res) => res.json());
    } catch (e) {
      console.log(e);
      await interaction.editReply({ content: `Could not load season 2 info.`, ephemeral: true });
      return;
    }

    if (Object.keys(joinSeason3Res).length == 0) {
      await interaction.editReply({
        content: `To claim your gift you must first register using the command /linkwallet.`,
        ephemeral: true,
      });
      return;
    }

    if (joinSeason3Res.joined) {
      await interaction.editReply({
        content: `You've already claimed your gift.`,
        ephemeral: true,
      });
      return;
    }

    interaction.guild.members.fetch(userId, { force: true }).then(async (member: GuildMember) => {
      const isVeteran = joinSeason3Res.timestamp;
      const roles = await member.fetch(true).then((m: GuildMember) => m.roles.cache.map((r) => r.name));

      if (isVeteran) {
        const role = await interaction.guild.roles.fetch(SEASON_3_ROLE_ID);
        await member.roles.add(role);
      }

      const { originalTxId } = (await contract.writeInteraction(
        {
          function: 'addPoints',
          points: 15000,
          adminId: '769844280767807520',
          members: [{ id: userId, roles }],
          noBoost: true,
        },
        { tags: [new Tag('Reward-For', 'Join-Season-3')] }
      )) as WriteInteractionResponse;

      const content = isVeteran
        ? `Congratulations <@${userId}>, you have earned 15,000 **RSG** <:RSG:1131247707017715882> and the role of <@&${SEASON_3_ROLE_ID}> for participating in Season 2 of the RedStone Expedition.`
        : `Congratulations <@${userId}>, you have earned 15,000 **RSG** <:RSG:1131247707017715882>. You are now entering Season III of the RedStone Expedition.
        `;
      await interaction.editReply({
        content,
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
            description: `Find out how to become a member of the RedStone Community and earn more RSG in the [Community Guidebook](https://redstone-finance.notion.site/RedStone-Community-Guidebook-282d9d43e6b74bb0a275dfa0bafa8548).
            `,
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
    });
  },
};
