import { Response } from 'express';
import { RequestWithContext } from '../../types/express';
import { GuildMember, Role } from 'discord.js';

export async function userRoles(req: RequestWithContext, res: Response) {
  const { id } = req.query;

  try {
    if (!id) {
      res.status(422).send(`User id should be provided.`);
    } else if (!req.ctx?.serverId) {
      res.status(422).send(`Server id is not set.`);
    } else {
      const guild = await req.ctx?.client.guilds.fetch(req.ctx?.serverId);
      const member = await guild?.members.fetch(id as string);
      const roles = member.roles.cache.map((r: Role) => r.name);
      res.send(roles);
      res.status(200);
    }
  } catch (e: any) {
    res.status(500).send(e.message);
  }
}
