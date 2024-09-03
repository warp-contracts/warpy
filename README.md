# Warpy Discord Bot

Warpy is a transparent, cost-effective, onchain Points System designed to enhance engagement on the web3-related community Discord server.

- **Transparency**: everyone can verify the point calculation for any account
- **Economic Viability**: low data storage costs, even on a decentralized layer
- **Onchain Integrity**: ensures equal access to information and tech stack for all

Built on [Warp Contracts](https://github.com/warp-contracts), a smart contract SDK on [Arweave](https://www.arweave.org), and integrating with Discord's development tools, Warpy makes it feasible to uphold a fully transparent and cost-effective onchain Points System that seamlessly merges with the leading community platform.

Here's the repo for our app and the Warpy Discord Bot, set to pilot on the [*RedStone Oracles Discord Community*](https://discord.com/invite/PVxBZKFr46).

## Warpy’s infrastructure

Warpy’s built on set of the two contracts:

### 1. The main bot contract

Records events like messages or user commands (e.g. `addrsg` command) using the Warp SDK. These are sent to the Warp Sequencer, which organizes them for the Irys.xyz, an Arweave scaling solution. Irys packages these interactions and settles it on the Arweave blockchain, ensuring immutable records accessible anytime. Information is stored in the contract state, and with Arweave's record of all interactions, one can always determine the contract state using Warp. To retrieve specific data, like a user's RSG balance, we query Warp DRE nodes. This tool offloads execution to validators, offering near-instant response time without compromising decentralization.

### 2. Servers’ registration contract

When Warpy joins a server, we deploy a new bot contract as described in point 1. This contract maintains a map linking Discord server IDs (where Warpy operates) to their respective bot contract IDs. The interaction flow is the same as in point 1.

## Warpy's component interactions and events

Warpy app breaks down into component interactions and events:

### Component Interactions:

- `linkwallet`: Registers a user's EVM wallet in the contract name service.
- `contract`: Provides a link to the server's contract in SonAr.
- `addrsg`: Lets server admins grant RSG to a user.
- `removersg`: Lets server admins deduct RSG from a user.
- `addrsgtorole`: Grants RSG to all users of a specific role.
- `addroleseason`: Sets a role season, boosting points for certain roles for a set duration.
- `counter`: Displays a user's current RSG balance and their activity stats.
- `ranking`: Lists the top 10 users by score.

### Events

- `guildCreate`: On Warpy joining a server, it deploys a new bot contract, ensuring each server operates on a unique contract.
- `messageReactionAdd`: Reacting to a message gives 1 point.
- `messageReactionRemove`: Removing a reaction deducts 1 point

## Admin Panel 

Alongside the Discord bot, there's a Warpy Admin Panel tailored for server admins. After connecting their EVM wallet, they can directly interact with their server's contract. 

Default features include:

- Managing admins: Add or remove.
- Boost adjustments: Set, modify, or delete boosts.
- User-specific boosts: Assign or remove boosts for individual users.
- Seasons: Launch a new season with defined start and end timestamps. During a season, a set boost is applied to all points earned by users.

[***Functionality***](https://warpik-admin-panel.vercel.app/)


## Warpy's Dashboard

The Warpy Dashboard provides users with a view of all-time and seasonal rankings. Users can connect their wallets to view their recent points history and see any active boosts they possess.

[***Mockup***](https://warpik-dashboard.vercel.app/)

### Warpy Discord Bot Tools

1. [Discord.js](https://github.com/discordjs/discord.js)
2. [Warp-contracts](https://github.com/warp-contracts)  
3. [Irys](https://github.com/Irys-xyz)
4. [Ethers.js](https://github.com/ethers-io/ethers.js)

### Warpy Admin Panel & Dashboard Tools

1. [Solid-js](https://github.com/solidjs/solid)
2. [Vite](https://vitejs.dev/)
3. [Sass](https://sass-lang.com/)





