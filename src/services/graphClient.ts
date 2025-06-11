import axios from "axios";

export async function fetchLatestPositionId(walletAddress: string): Promise<string | null> {
  const endpoint = "https://api.goldsky.com/api/public/project_clyiptt06ifuv01ul9xiwfj28/subgraphs/overlay-bnb-testnet/latest/gn";
  const query = `
    query openPositions($account: ID!, $first: Int, $skip: Int) {
      account(id: $account) {
        positions(
          where: {
            isLiquidated: false
            fractionUnwound_lt: "1000000000000000000"
          }
          orderBy: createdAtTimestamp
          orderDirection: desc
          first: $first
          skip: $skip
        ) {
          positionId
        }
      }
    }
  `;

  try {
    const res = await axios.post(endpoint, {
      query,
      variables: {
        account: walletAddress.toLowerCase(),
        first: 1,
        skip: 0
      }
    });

    const positions = res.data?.data?.account?.positions ?? [];
    return positions.length > 0 ? positions[0].positionId : null;
  } catch (err) {
    console.error("[GraphQL] Gagal ambil posisi:", err.message);
    return null;
  }
}

export interface Position {
  positionId: string;
  isLong: boolean;
  market: { id: string };
}

export async function fetchPositions(walletAddress: string): Promise<Position[]> {
  const endpoint = "https://api.goldsky.com/api/public/project_clyiptt06ifuv01ul9xiwfj28/subgraphs/overlay-bnb-testnet/latest/gn";
  const query = `
    query Positions($account: ID!, $first: Int, $skip: Int) {
      account(id: $account) {
        positions(
          where: {
            isLiquidated: false
            fractionUnwound_lt: "1000000000000000000"
          }
          orderBy: createdAtTimestamp
          orderDirection: desc
          first: $first
          skip: $skip
        ) {
          positionId
          isLong 
          market {
            id
          }
        }
      }
    }
  `;

  try {
    const res = await axios.post(endpoint, {
      query,
      variables: {
        account: walletAddress.toLowerCase(),
        first: 1000,
        skip: 0
      }
    });

    const positions = res.data?.data?.account?.positions ?? [];
    return positions as Position[];
  } catch (err: any) {
    console.error("[GraphQL] Gagal ambil posisi:", err.message);
    return [];
  }
}
