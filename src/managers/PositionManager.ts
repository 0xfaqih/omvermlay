import { Wallet, Contract, formatUnits, parseUnits } from "ethers";
import overlayAbi from "../abis/overlayAbi.json";
import { COLLATERAL_AMOUNT_OVL, DELAY_BETWEEN_RUNS_MS, LEVERAGE, OVL_CONTRACT_ADDRESS, UNWIND_FRACTION } from "../config/constants";
import { log } from "../core/logger";
import { calculatePriceLimit } from "../core/priceUtils";
import { fetchMarketOverview } from "../services/overlayApi";
import { fetchLatestPositionId } from "../services/graphClient";
import { ensureAllowance } from "../services/allowance";
import { delay } from "../utils/delay";

export class PositionManager {
  private wallet: Wallet;
  private contract: Contract;
  private marketName: string;

  constructor(wallet: Wallet, deploymentAddress: string, marketName: string) {
    this.wallet = wallet;
    this.marketName = marketName;
    this.contract = new Contract(deploymentAddress, overlayAbi as any, wallet);
  }

  async getLatestPrice(): Promise<bigint> {
    const overview = await fetchMarketOverview(this.contract.target as string);
    if (!overview?.latestPrice) {
      throw new Error("Gagal ambil latestPrice dari API");
    }
    return parseUnits(overview.latestPrice.toString(), 18);
  }

  async openPosition(isLong: boolean): Promise<string> {
    await ensureAllowance(
      this.wallet,
      OVL_CONTRACT_ADDRESS, // token OVL address
      this.contract.target as string,             // spender = market contract
      COLLATERAL_AMOUNT_OVL
    );

    const collateral = parseUnits(COLLATERAL_AMOUNT_OVL, 18);
    const leverage = parseUnits(LEVERAGE.toString(), 18);
    const currentPrice = await this.getLatestPrice();
    const priceLimit = calculatePriceLimit(currentPrice, isLong, true);

    const tx = await this.contract.build(collateral, leverage, isLong, priceLimit);
    await log(`🔓 <b>Build TX dikirim</b>: <code>${tx.hash}</code>`);

    await log(`⏳ Menunggu ${DELAY_BETWEEN_RUNS_MS / 1000}s sebelum siklus berikutnya...`);
        await delay(DELAY_BETWEEN_RUNS_MS);

    const positionId = await fetchLatestPositionId(this.wallet.address);
    if (!positionId) throw new Error("Gagal ambil positionId dari GraphQL");

    await log(`📈 <b>Posisi Dibuka</b>: ${positionId} (${this.marketName})`);
    return positionId;
  }

  async closePosition(positionId: string, isLong: boolean): Promise<void> {
    const currentPrice = await this.getLatestPrice();
    const priceLimit = calculatePriceLimit(currentPrice, isLong, false);
    const fraction = parseUnits(UNWIND_FRACTION, 18);

    const tx = await this.contract.unwind(positionId, fraction, priceLimit);
    await log(`🛑 <b>Unwind TX dikirim</b>: <code>${tx.hash}</code>`);
    await tx.wait();

    await log(`✅ Posisi ${positionId} berhasil ditutup.`);
  }
}
