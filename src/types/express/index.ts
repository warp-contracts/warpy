import { Client } from 'discord.js';
import { Request } from 'express';

export interface RequestWithContext extends Request {
  ctx?: {
    client: Client;
  };
}
