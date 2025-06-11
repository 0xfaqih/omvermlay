// src/utils/telegram.ts
import axios from "axios";
import { TELEGRAM_TOKEN, TELEGRAM_CHAT_ID, TELEGRAM_THREAD_ID } from "../config/env";

export async function sendTelegramHtml(message: string): Promise<void> {
  try {
    const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`;

    await axios.post(url, {
      chat_id: TELEGRAM_CHAT_ID,
      message_thread_id: TELEGRAM_THREAD_ID,
      text: message,
      parse_mode: "HTML"
    });
  } catch (err) {
    console.error("[Telegram] Gagal mengirim pesan:", err.message);
  }
}
