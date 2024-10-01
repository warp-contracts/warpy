import { Response } from 'express';
import { RequestWithContext } from '../../types/express';

export async function usernames(req: RequestWithContext, res: Response) {
  const { ids } = req.query;

  try {
    if (!ids) {
      res.status(422).send(`Ids should be provided.`);
    } else if (!req.ctx?.serverId) {
      res.status(422).send(`Server id is not set.`);
    } else {
      const idsArray = (ids as string).split(',').filter((id) => id !== null && id !== '');
      console.log(`Fetch guild`);
      const guild = await req.ctx?.client.guilds.fetch(req.ctx?.serverId);
      console.log(`Fetch members`, idsArray);
      const members = await guild?.members.fetch({ user: idsArray });
      console.log(`Got it, so great! so success!`);
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
