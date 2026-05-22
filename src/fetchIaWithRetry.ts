import CONFIG from "../config";
import fetchIa from "./fetchIa";

interface RetryConfig {
  MAX_ATTEMPTS: number;
  DELAY_MS: number;
}

const retryConfigData = CONFIG.RETRY;

export default async function fetchWithRetry(
  model: string,
  messages: Array<{ role: string; content: string }>,
  retryConfig: RetryConfig = retryConfigData,
) {
  let lastError: unknown | null = null;

  for (let i = 0; i < retryConfig.MAX_ATTEMPTS; i++) {
    try {
      return await fetchIa(model, messages);
    } catch (error: unknown) {
      lastError = error;

      let timeWait = retryConfig.DELAY_MS * i;
      await new Promise((resolve) => setTimeout(resolve, timeWait));
    }
  }
  throw lastError;
}
