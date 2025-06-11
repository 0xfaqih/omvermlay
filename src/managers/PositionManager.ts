import { Wallet, Contract, formatUnits, parseUnits } from "ethers";
import overlayAbi from "../abis/overlayAbi.json";
import { DELAY_BETWEEN_RUNS_MS, OVL_CONTRACT_ADDRESS, UNWIND_FRACTION } from "../config/constants";
import { log } from "../core/logger";
import { calculatePriceLimit } from "../core/priceUtils";
import { fetchMarketOverview } from "../services/overlayApi";
import { fetchLatestPositionId } from "../services/graphClient";
import { ensureAllowance } from "../services/allowance";
import { delay } from "../utils/delay";
import { getRandomCollateralAmountOvl, getRandomLeverage } from "../utils/random";

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
    const randomCollateral = getRandomCollateralAmountOvl();

    await ensureAllowance(
      this.wallet,
      OVL_CONTRACT_ADDRESS, 
      this.contract.target as string,             
      randomCollateral
    );

    const randomLeverage = getRandomLeverage();
    const collateral = parseUnits(randomCollateral, 18);
    const leverage = parseUnits(randomLeverage.toString(), 18);
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
    const receipt = await tx.wait();
    await log(`✅ Transaksi sukses di blok ${receipt.blockNumber}, tx hash: ${tx.hash}`);
    await log(`✅ Posisi ${positionId} berhasil ditutup.`);
  }
}
