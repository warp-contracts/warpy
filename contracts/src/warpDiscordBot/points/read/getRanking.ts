import { ContractAction, ContractState, ContractResult } from '../../types/types';

export const getRanking = async (state: ContractState, { input }: ContractAction): Promise<ContractResult> => {
  const { limit, address } = input;

  const balances = state.balances;
  const balancesSorted = Object.entries(balances).sort((a, b) => Number(b[1]) - Number(a[1]));
  const ranking = balancesSorted.slice(0, limit || 15).map((r, i) => {
    return {
      lp: i + 1,
      userId: Object.keys(state.users).find((u) => state.users[u] == r[0]),
      address: r[0],
      balance: r[1],
    };
  });

  let userPositionInRanking;
  let userId;
  if (address) {
    userId = Object.keys(state.users).find((u) => state.users[u] == address);
    userPositionInRanking = getIndexOf(balancesSorted, address);
  }

  return {
    result: {
      ranking,
      ...(userPositionInRanking && {
        userPosition: {
          lp: userPositionInRanking,
          userId,
          address: state.users[userId],
          balance: state.balances[state.users[userId]],
        },
      }),
    },
  };
};

const getIndexOf = (array: [string, number][], walletAddress: string) => {
  for (let i = 0; i < array.length; i++) {
    if (array[i][0] == walletAddress) {
      return i + 1;
    }
  }

  return false;
};
