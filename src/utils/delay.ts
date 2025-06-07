// src/utils/delay.ts

export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

import { MIN_UNWIND_DELAY_MINUTES, MAX_UNWIND_DELAY_MINUTES } from "../config/constants";

export function getRandomUnwindDelayMinutes(): number {
  return Math.floor(Math.random() * (MAX_UNWIND_DELAY_MINUTES - MIN_UNWIND_DELAY_MINUTES + 1)) + MIN_UNWIND_DELAY_MINUTES;
}

