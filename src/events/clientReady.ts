import { Events } from 'discord.js';

export default {
  name: Events.ClientReady,
  once: true,
  execute() {
    console.log('Warpy is online!');
  },
};
