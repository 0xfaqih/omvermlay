import { Wallet, JsonRpcProvider } from "ethers";
import { RPC_URL, DELAY_BETWEEN_RUNS_MS } from "../config/constants";
import { fetchMarketList } from "../services/overlayApi";
import { PositionManager } from "../managers/PositionManager";
import { PRIVATE_KEY } from "../config/env";
import { log } from "./logger";
import { delay, getRandomUnwindDelayMinutes } from "../utils/delay";

export async function runBotLoop() {
  while (true) {
    try {
      await runAutomationCycle();
    } catch (err: any) {
      await log(`❌ Kesalahan siklus: ${err.message}`, "error");
    }

    await log(
      `⏳ Menunggu ${
        DELAY_BETWEEN_RUNS_MS / 1000
      }s sebelum siklus berikutnya...`
    );
    await delay(DELAY_BETWEEN_RUNS_MS);
  }
}

async function runAutomationCycle() {
  await log("🚀 Memulai automasi trading...");

  const marketList = await fetchMarketList();
  if (!marketList.length) {
    throw new Error("Tidak ada market tersedia dari API.");
  }

  const market = marketList[Math.floor(Math.random() * marketList.length)];
  await log(`🎯 Market: ${market.marketName}`);

  const provider = new JsonRpcProvider(RPC_URL);
  const wallet = new Wallet(PRIVATE_KEY, provider);
  await log(`👤 Wallet: ${wallet.address}`);

  const isLong = Math.random() < 0.5;
  await log(`🎲 Arah posisi: ${isLong ? "LONG" : "SHORT"}`);

  const manager = new PositionManager(
    wallet,
    market.deploymentAddress,
    market.marketName
  );

  const positionId = await manager.openPosition(isLong);
  const unwindDelay = getRandomUnwindDelayMinutes();
  await log(`🕒 Menunggu ${unwindDelay} menit sebelum menutup posisi...`);
  await delay(unwindDelay * 60 * 1000);

  await manager.closePosition(positionId, isLong);
}
