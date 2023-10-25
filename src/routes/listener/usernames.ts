import { Response } from 'express';
import { RequestWithContext } from '../../types/express';

export async function usernames(req: RequestWithContext, res: Response) {
  const { users } = req.query;

  try {
    if (!users) {
      res.status(422).send(`Users should be provided.`);
    } else if (!req.ctx?.serverId) {
      res.status(422).send(`Server id is not set.`);
    } else {
      const usersArray = (users as string).split(',');
      const guild = await req.ctx?.client.guilds.fetch(req.ctx?.serverId);
      const members = await guild?.members.fetch({ user: usersArray });
      const handlers = members?.map((m) => {
        return { id: m.id, handler: m.user.username };
      });
      res.send(handlers);
      res.status(200);
    }
  } catch (e: any) {
    res.status(500).send(e.message);
  }
}
