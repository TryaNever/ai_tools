import fs from "node:fs/promises";
import path from "node:path";

const filePath = path.join(process.cwd(), "memory", "MEMORY.md");

export async function loadMemory() {
  try {
    const data = await fs.readFile(filePath, "utf8");
    return data.split("\n").filter(Boolean);
  } catch {
    return [];
  }
}
