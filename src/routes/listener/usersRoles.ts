import { Response } from 'express';
import { RequestWithContext } from '../../types/express';
import { Collection, GuildMember, Snowflake } from 'discord.js';

const IDS_LIMIT = 1000;

export async function usersRoles(req: RequestWithContext, res: Response) {
  const ids: string[] = req.body.ids

  try {
    if (!ids || ids.length == 0) {
      res.status(422).send(`At least one user id must be provided.`);
    } else if (!req.ctx?.serverId) {
      res.status(422).send(`Server id is not set.`);
    } else if (ids.length > IDS_LIMIT) {
      res.status(422).send(`Exceeded ids limit of ${IDS_LIMIT}`);
    } else {
      const guild = await req.ctx?.client.guilds.fetch(req.ctx?.serverId);

      const idToRoles = new Map();
      await guild.members.fetch({ user: ids })
          .then((members: Collection<Snowflake, GuildMember>) => {
            members.forEach((mem, id) => {
              idToRoles.set(id, mem.roles.cache.map((r) => r.name))
            })
          });
      res.send({ id_to_roles: idToRoles });
      res.status(200);
    }
  } catch (e: any) {
    res.status(500).send(e.message);
  }
}
