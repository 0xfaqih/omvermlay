import { MAX_COLLATERAL_AMOUNT, MIN_COLLATERAL_AMOUNT, MAX_LEVERAGE, MIN_LEVERAGE } from "../config/constants";

export function getRandomCollateralAmountOvl(): string {
  return (
    Math.floor(
      Math.random() * (MAX_COLLATERAL_AMOUNT - MIN_COLLATERAL_AMOUNT + 1)
    ) + MIN_COLLATERAL_AMOUNT
  ).toString();
}

export function getRandomLeverage(): number {
  return (
    Math.floor(
      Math.random() * (MAX_LEVERAGE - MIN_LEVERAGE + 1)
    ) + MIN_LEVERAGE
  );
}