import path from "node:path";

const CONFIG = {
  API: {
    GROQ_URL:
      process.env.GROQ_API_URL ||
      "https://api.groq.com/openai/v1/chat/completions",
    MODEL: process.env.AI_MODEL || "llama-3.3-70b-versatile",
    TIMEOUT_MS: Number(process.env.API_TIMEOUT_MS || "30000"),
  },
  OUTPUT: {
    README_PATH: path.resolve(process.cwd(), "README.md"),
    MAX_CHARS: Number(process.env.MAX_CHARS || "1000"),
  },
  RETRY: {
    MAX_ATTEMPTS: 3,
    DELAY_MS: 1000,
  },
  MEMORY: {
    LINE_LIMIT: 400,
  },
};

export default CONFIG;
