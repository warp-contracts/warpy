import { Response } from 'express';
import { RequestWithContext } from '../types/express';

export async function handlers(req: RequestWithContext, res: Response) {
  const { users } = req.query;

  try {
    if (!users) {
      res.status(422).send(`Users should be provided.`);
    } else {
      const usersArray = (users as string).split(',');
      const guild = await req.ctx?.client.guilds.fetch('1114217402125778997');
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
