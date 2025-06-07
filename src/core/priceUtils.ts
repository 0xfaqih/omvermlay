import { SLIPPAGE_PERCENT } from "../config/constants";

export function calculatePriceLimit(
  currentPrice: bigint,
  isLong: boolean,
  isOpening: boolean
): bigint {
  const slippageBps = BigInt(Math.round(SLIPPAGE_PERCENT * 100));
  const slippageAmount = (currentPrice * slippageBps) / 10000n;

  if (isOpening) {
    return isLong ? currentPrice + slippageAmount : currentPrice - slippageAmount;
  } else {
    return isLong ? currentPrice - slippageAmount : currentPrice + slippageAmount;
  }
}
