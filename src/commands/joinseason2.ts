import { GuildMember, SlashCommandBuilder } from 'discord.js';
import { connectToServerContract, warpyIconUrl, getSonarInteractionUrl, getSonarContractUrl } from '../utils';
import { Tag, Warp, WriteInteractionResponse } from 'warp-contracts';
import { REDSTONE_SERVER_CONTRACT_ID } from '../utils';

const SEASON_2_START_TIMESTAMP = 1719871200000;
const SEASON_2_ROLE_ID = '1256189348022587453';

export default {
  data: new SlashCommandBuilder().setName('joinseason2').setDescription('Join Season 2 of Redstone campaign.'),
  async execute(interaction: any, warp: Warp, warpWallet: any) {
    await interaction.deferReply();
    const contract = await connectToServerContract(warp, warpWallet, interaction.guildId);
    const userId = interaction.user.id;

    let joinSeason2Res: { id: string; joined: boolean; timestamp: string };
    try {
      joinSeason2Res = await fetch(
        `https://gw.warp.cc/gateway/warpy/join-season-2?contractId=${REDSTONE_SERVER_CONTRACT_ID}&userId=${userId}`
      ).then((res) => res.json());
    } catch (e) {
      await interaction.editReply({ content: `Could not load season 2 info.`, ephemeral: true });
      return;
    }

    if (!joinSeason2Res) {
      await interaction.editReply({
        content: `To claim your gift you must first register using the command /linkwallet.`,
        ephemeral: true,
      });
      return;
    }

    if (joinSeason2Res.joined) {
      await interaction.editReply({
        content: `You've already claimed your gift.`,
        ephemeral: true,
      });
      return;
    }

    interaction.guild.members.fetch(userId, { force: true }).then(async (member: GuildMember) => {
      const isVeteran = parseInt(joinSeason2Res.timestamp) < SEASON_2_START_TIMESTAMP;
      const roles = await member.fetch(true).then((m: GuildMember) => m.roles.cache.map((r) => r.name));

      if (isVeteran) {
        const role = await interaction.guild.roles.fetch(SEASON_2_ROLE_ID);
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
        { tags: [new Tag('Reward-For', 'Join-Season-2')] }
      )) as WriteInteractionResponse;

      const content = isVeteran
        ? `Congratulations <@${userId}>, you have earned 15,000 **RSG** <:RSG:1131247707017715882> and the role of <@&${SEASON_2_ROLE_ID}> for participating in Season 1 of the RedStone Expedition.`
        : `Congratulations <@${userId}>, you have earned 15,000 **RSG** <:RSG:1131247707017715882>. You are now entering Season II of the RedStone Expedition.
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
