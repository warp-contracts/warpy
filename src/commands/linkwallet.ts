import { SlashCommandBuilder } from 'discord.js';
import { isEthWallet, getStateFromDre, connectToServerContract, warpyIconUrl } from '../utils';
import { Tag, Warp, WriteInteractionResponse } from 'warp-contracts';

export default {
  data: new SlashCommandBuilder()
    .setName('linkwallet')
    .setDescription('Links ETH wallet to the discord account.')
    .addStringOption((option) =>
      option.setName('address').setDescription('Your ETH wallet address.').setRequired(true)
    ),
  async execute(interaction: any, warp: Warp, warpWallet: any) {
    const contract = await connectToServerContract(warp, warpWallet, interaction.guildId);
    interaction.channel.sendTyping();

    const wallet = interaction.options.getString('address');
    const userId = interaction.user.id;
    if (!isEthWallet(wallet)) {
      await interaction.reply('Wallet address is not valid.');
      return null;
    }

    let address: string | [];
    try {
      address = (await getStateFromDre(contract.txId(), 'users', userId)).result;
    } catch (e) {
      await interaction.reply(`Could not load state from D.R.E. nodes.`);
      return;
    }

    if (address.length > 0) {
      await interaction.reply('User already registered.');
      return null;
    }

    const { originalTxId } = (await contract.writeInteraction({
      function: 'registerUser',
      id: userId,
      address: wallet,
    })) as WriteInteractionResponse;

    let result: { interactions: number; reactions: number }[];

    try {
      result = (await getStateFromDre(contract.txId(), 'counter', userId)).result;
    } catch (e) {
      await interaction.reply(`Could not load state from D.R.E. nodes.`);
      return;
    }

    if (result.length > 0) {
      await contract.writeInteraction(
        { function: 'mint', id: userId },
        {
          tags: [new Tag('Indexed-By', `mint;${userId};${interaction.guildId};`)],
        }
      );
    }

    await interaction.reply({
      content: `User registered correctly.`,
      tts: true,
      components: [
        {
          type: 1,
          components: [
            {
              style: 5,
              label: `Check out interaction`,
              url: `https://sonar.warp.cc/#/app/interaction/${originalTxId}?network=mainnet`,
              disabled: false,
              type: 2,
            },
            {
              style: 5,
              label: `Check out contract state`,
              url: `https://sonar.warp.cc/#/app/contract/${contract.txId()}?network=mainnet#current-state`,
              disabled: false,
              type: 2,
            },
          ],
        },
      ],
      embeds: [
        {
          type: 'rich',
          description: `<@${userId}> has registered wallet address.`,
          color: 0x6c8cfd,
          fields: [
            {
              name: `Wallet address`,
              value: wallet,
            },
          ],
          thumbnail: {
            url: warpyIconUrl,
            height: 0,
            width: 0,
          },
          timestamp: new Date().toISOString(),
        },
      ],
    });
  },
};
