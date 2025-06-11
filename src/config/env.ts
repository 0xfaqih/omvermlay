import dotenv from "dotenv";
dotenv.config();

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Lingkungan membutuhkan variabel: ${name}`);
  }
  return value;
}

export const PRIVATE_KEY = requireEnv("PRIVATE_KEY");
export const RPC_URL = requireEnv("RPC_URL");

export const TELEGRAM_TOKEN = requireEnv("TELEGRAM_TOKEN");
export const TELEGRAM_CHAT_ID = requireEnv("TELEGRAM_CHAT_ID");
export const TELEGRAM_THREAD_ID = requireEnv("TELEGRAM_THREAD_ID");
