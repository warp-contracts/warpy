import { Response } from 'express';
import { RequestWithContext } from '../types/express';

export async function health(req: RequestWithContext, res: Response) {
  if (req.ctx?.client.isReady()) {
    res.sendStatus(200);
  }
}
