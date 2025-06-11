import { Wallet, JsonRpcProvider } from "ethers";
import {
  RPC_URL,
  DELAY_BETWEEN_RUNS_MS,
  DELAY_FAUCET,
} from "../config/constants";
import { claimFaucet, fetchMarketList } from "../services/overlayApi";
import { PositionManager } from "../managers/PositionManager";
import { PRIVATE_KEY } from "../config/env";
import { log } from "./logger";
import { delay, getRandomUnwindDelayMinutes } from "../utils/delay";
import { fetchPositions } from "../services/graphClient";

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
  const provider = new JsonRpcProvider(RPC_URL);
  const wallet = new Wallet(PRIVATE_KEY, provider);
  await log(`👤 Wallet: ${wallet.address}`);
  await handleFaucet(wallet.address);
  await log("🚀 Memulai automasi trading...");

  const marketList = await fetchMarketList();
  if (!marketList.length) throw new Error("Tidak ada market tersedia dari API.");

  const positions = await fetchPositions(wallet.address);
  for (const pos of positions) {
    const market = marketList.find(
      (m) => m.deploymentAddress === pos.market.id.toLowerCase()
    );
    if (!market) {
      await log(`❌ Deployment address ${pos.market.id} tidak ditemukan di marketList!`);
      continue;
    }
    const manager = new PositionManager(wallet, market.deploymentAddress, market.marketName);
    try {
      await manager.closePosition(pos.positionId, pos.isLong);
      await log(`✅ Posisi ${pos.positionId} (${market.marketName}) berhasil ditutup`);
    } catch (err: any) {
      await log(`❌ Gagal menutup posisi ${pos.positionId} di market ${market.marketName}: ${err.message || err}`);
    }
  }

  const market = pickRandomMarket(marketList);
  await log(`🎯 Market: ${market.marketName}`);
  const isLong = Math.random() < 0.5;
  await log(`🎲 Arah posisi: ${isLong ? "LONG" : "SHORT"}`);
  const manager = new PositionManager(wallet, market.deploymentAddress, market.marketName);
  const positionId = await manager.openPosition(isLong);
  const unwindDelay = getRandomUnwindDelayMinutes();
  await log(`🕒 Menunggu ${unwindDelay} menit sebelum menutup posisi...`);
  await delay(unwindDelay * 60 * 1000);
  await manager.closePosition(positionId, isLong);
}


let lastClaim = 0;
async function handleFaucet(address: string) {
  const now = Date.now();

  if (now - lastClaim < DELAY_FAUCET) {
    await log("💧 Faucet sudah diklaim kurang dari 24 jam lalu. Skip.");
    return;
  }

  const faucetResult = await claimFaucet(address);
  for (const [key, value] of Object.entries(faucetResult)) {
    if (value.status === "error") {
      await log(`Gagal klaim di ${key}: ${value.reason}`);
    } else if (value.status === "success") {
      await log(`Berhasil klaim di ${key}, txHash: ${value.txHash}`);
    }
  }

  lastClaim = now;
}

function pickRandomMarket(marketList: any[]) {
  return marketList[Math.floor(Math.random() * marketList.length)];
}
