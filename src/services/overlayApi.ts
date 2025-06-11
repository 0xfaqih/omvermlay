import axios from "axios";
import { ClaimStatusResponse, MarketInfo } from "../types/market";

export async function fetchMarketList(): Promise<MarketInfo[]> {
  try {
    const res = await axios.get("https://api.overlay.market/data/api/markets/chain/97");
    const data = res.data;

    const list: MarketInfo[] = [];

    for (const market of data) {
      for (const chain of market.chains) {
        list.push({
          marketName: market.marketName,
          deploymentAddress: chain.deploymentAddress
        });
      }
    }

    return list;
  } catch (err) {
    console.error("[OverlayAPI] Gagal fetch market list:", err.message);
    return [];
  }
}

export async function fetchMarketOverview(marketAddress: string): Promise<{ latestPrice?: string } | null> {
  try {
    const res = await axios.get("https://api.overlay.market/bsc-testnet-charts/v1/charts/marketsPricesOverview");
    const data = res.data;

    const matched = data.find(
      (m: any) => m.marketAddress.toLowerCase() === marketAddress.toLowerCase()
    );

    return matched || null;
  } catch (err) {
    console.error("[OverlayAPI] Gagal fetch market overview:", err.message);
    return null;
  }
}

export async function claimFaucet(walletAddress: string): Promise<ClaimStatusResponse> {
  const payload = {
    tokens: ["ovl", "eth"],
    chains: ["bnb-testnet"],
    recipient: walletAddress
  }
  try {
    const res = await axios.post("https://api.overlay.market/faucet/", payload);
    return res.data as ClaimStatusResponse;
  } catch (err) {
    console.error("[OverlayAPI] Gagal claim faucet:", err.message);
    return { [walletAddress]: { status: 'error', reason: err.message } };
  }
}