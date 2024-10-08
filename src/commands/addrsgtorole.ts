import { GuildMember, SlashCommandBuilder } from 'discord.js';
import { connectToServerContract, getSonarContractUrl, getStateFromDre, warpyIconUrl } from '../utils';
import { Warp, WriteInteractionResponse } from 'warp-contracts';
import fs from 'fs';

export default {
  data: new SlashCommandBuilder()
    .setName('addrsgtorole')
    .setDescription(`Add RSG to specific role (only available for admins).`)
    .addStringOption((option) =>
      option.setName('role').setDescription('Role which members will be awarded with RSG.').setRequired(true)
    )
    .addIntegerOption((option) => option.setName('rsg').setDescription('Number of RSG.').setRequired(true))
    .addBooleanOption((option) =>
      option.setName('noboost').setDescription('If true - boost will not be applied to the number of RSG.')
    ),
  async execute(interaction: any, warp: Warp, wallet: any) {
    await interaction.deferReply();

    const contract = await connectToServerContract(warp, wallet, interaction.guildId);

    let response: any;
    try {
      response = (await getStateFromDre(contract.txId(), 'admins')).result;
      if (!response.includes(interaction.user.id)) {
        await interaction.editReply('Only admin can award RSG.');
        return;
      }
    } catch (e) {
      await interaction.editReply(`Could not load state from D.R.E. nodes.`);
      return;
    }

    const rsg = interaction.options.getInteger('rsg');
    const role = interaction.options.getString('role');
    const noBoost = interaction.options.getBoolean('noboost');
    if (isNaN(Number(rsg))) {
      await interaction.editReply('Incorrect number of RSG.');
      return;
    }
    const roleId = role.replace(/[<>@&]/g, '');
    await interaction.guild.members.fetch({ force: true });

    let members;
    if (roleId == 'everyone') {
      members = interaction.guild.members.cache;
    } else {
      members = await interaction.guild.roles.fetch(roleId, { force: true }).then((r: any) => r?.members);
    }

    console.log(`Found ${members.size} members having ${role} role.`);

    const membersInWarpy = await Promise.all(
      members
        // .filter((m: any) => Object.prototype.hasOwnProperty.call(response.users, m.id))
        .map(async (member: any) => {
          const roles = await member.fetch().then((m: GuildMember) => m.roles.cache.map((r) => r.name));
          return {
            id: member.user.id,
            roles,
          };
        })
    );

    console.log(`Mapped ${members.size} members having ${role} role.`);

    const chunkSize = 80;
    for (let i = 0; i < membersInWarpy.length; i += chunkSize) {
      const chunk = membersInWarpy.slice(i, i + chunkSize);
      const addPointsInput = {
        function: 'addPoints',
        points: rsg,
        adminId: interaction.user.id,
        members: chunk,
        ...(noBoost && { noBoost }),
      };
      try {
        const { originalTxId } = (await contract.writeInteraction(addPointsInput)) as WriteInteractionResponse;
        console.log(`Role: ${role} has been rewarded, interaction id: ${originalTxId}, chunk length: ${chunk.length}`);
      } catch (e: any) {
        if (
          JSON.stringify(e).includes(`Nested bundle tags exceed limit`) ||
          (typeof e?.message == 'string' && e?.message?.includes(`exceeds maximum interactions size limit`))
        ) {
          const halfChunk = Math.ceil(chunk.length / 2);
          const slicedChunks = [chunk.slice(0, halfChunk), chunk.slice(halfChunk, chunk.length)];

          for (let slicedChunk of slicedChunks) {
            try {
              await contract.writeInteraction({
                ...addPointsInput,
                members: slicedChunk,
              });
              continue;
            } catch (e) {
              console.error(
                `[${new Date().toLocaleString()}] Error while executing interaction: ${JSON.stringify(addPointsInput)}`,
                e
              );
              continue;
            }
          }
          continue;
        }
        console.error(
          `[${new Date().toLocaleString()}] Error while executing interaction: ${JSON.stringify(addPointsInput)}`,
          e
        );
        continue;
      }
    }

    await interaction.editReply({
      content: `Role has been awarded with RSG <:RSG:1131247707017715882>.`,
      tts: true,
      embeds: [
        {
          type: 'rich',
          description: `All users having below role have been rewarded with RSG <:RSG:1131247707017715882>.`,
          color: 0x6c8cfd,
          fields: [
            {
              name: `Role`,
              value: role,
            },
            {
              name: `RSG`,
              value: `${rsg} <:RSG:1131247707017715882>`,
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
  },
};
