import { GuildMember } from 'discord.js';
import { JWKInterface, Tag, Warp, WriteInteractionResponse } from 'warp-contracts';
import { connectToServerContract, getStateFromDre } from '../utils';
import { RolesToBeRewarded } from '../types/discord';

const rolesToBeRewarded: RolesToBeRewarded[] = [
  { role: 'Ore Digger', points: 1000 },
  { role: 'Rock Breaker', points: 5000 },
];

export default {
  name: 'guildMemberUpdate',
  async execute(oldMember: GuildMember, newMember: GuildMember, warp: Warp, wallet: JWKInterface) {
    const contract = await connectToServerContract(warp, wallet, newMember.guild.id);
    try {
      const result = (await getStateFromDre(contract.txId(), 'users', newMember.id)).result[0];
      if (result.length == 0) {
        return;
      }
    } catch (e) {
      console.error(`Could not load state from DRE in roleAdd event.`);
      return;
    }

    const oldRoles = oldMember.roles.cache.map((r: any) => r.name);
    const newRoles = newMember.roles.cache.map((r: any) => r.name);
    const memberId = newMember.id;

    for (const r of rolesToBeRewarded) {
      try {
        if (!oldRoles.includes(r.role) && newRoles.includes(r.role)) {
          console.info(`User ${memberId} received rewarded role: ${r.role}.`);
        } else {
          continue;
        }

        const { originalTxId } = (await contract.writeInteraction(
          {
            function: 'addPoints',
            points: r.points,
            adminId: process.env.ADMIN_ID,
            members: [{ id: newMember.id, roles: newMember.roles.cache.map((r: any) => r.name) }],
          },
          {
            tags: [new Tag('Indexed-By', `role-reward;${memberId};${newMember.guild.id};`)],
          }
        )) as WriteInteractionResponse;

        console.info(
          `Interaction ${originalTxId} for role rewarding sent to Warpy. User: ${memberId}, role: ${r.role}.`
        );
      } catch (e: any) {
        console.error(`Unable to write interaction. User: ${memberId}, role: ${r.role}.`);
        continue;
      }
    }
  },
};
