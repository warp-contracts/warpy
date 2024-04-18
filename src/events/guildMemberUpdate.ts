import { GuildMember } from 'discord.js';
import { JWKInterface, Tag, Warp, WriteInteractionResponse } from 'warp-contracts';
import { connectToServerContract, getStateFromDre } from '../utils';
import { RolesToBeRewarded } from '../types/discord';

const rolesToBeRewarded: RolesToBeRewarded[] = [
  { role: 'kicia', points: 1000 },
  { role: 'Rock Breaker', points: 5000 },
  { role: 'Frens', points: 100000 },
];

export default {
  name: 'guildMemberUpdate',
  async execute(oldMember: GuildMember, newMember: GuildMember, warp: Warp, wallet: JWKInterface) {
    const contract = await connectToServerContract(warp, wallet, newMember.guild.id);

    let oldRoles: string[] = [];
    let newRoles: string[] = [];
    oldRoles = oldMember.roles.cache.map((r: any) => r.name);
    await newMember.fetch(true).then((mem) => {
      newRoles = mem.roles.cache.map((r: any) => r.name);
    });

    let shouldContinue = false;
    for (const r of rolesToBeRewarded) {
      if (!oldRoles.includes(r.role) && newRoles.includes(r.role)) {
        shouldContinue = true;
        break;
      } else {
        continue;
      }
    }

    if (!shouldContinue) {
      console.info(
        `No roles to be rewarded. User id: ${newMember.id}. Old roles: ${JSON.stringify(
          oldRoles
        )}. New roles: ${JSON.stringify(newRoles)}`
      );
      return;
    }

    try {
      const result = (await getStateFromDre(contract.txId(), 'users', newMember.id)).result;
      if (!result) {
        console.info(
          `User not registered in Warpy. User id: ${newMember.id}. Old roles: ${JSON.stringify(
            oldRoles
          )}. New roles: ${JSON.stringify(newRoles)}`
        );
        return;
      }
    } catch (e) {
      console.error(
        `Could not load state from DRE in roleAdd event. User: ${newMember.id}. Old roles: ${JSON.stringify(
          oldRoles
        )}. New roles: ${JSON.stringify} ${JSON.stringify(e)}`
      );
      return;
    }

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
            noBoost: true,
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
