import { WALLET_NAME } from "../config/constants";
import { sendTelegramHtml } from "../utils/telegram";

type LogType = "info" | "error";

export async function log(message: string, type: LogType = "info") {
  const timestamp = new Date().toLocaleString();
  const formatted = `[${timestamp}] ${message}`;
  console[type === "error" ? "error" : "log"](formatted);

  if (type === "error") {
    const htmlMessage = `🚨 <b>${WALLET_NAME}\n</b>❌ <b>ERROR</b>\n<code>${timestamp}</code>\n${message}`;
    await sendTelegramHtml(htmlMessage);
  }
}
