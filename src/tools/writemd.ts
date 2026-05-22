import fs from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import CONFIG from "../../config";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fileName = CONFIG.OUTPUT.README_PATH;

export default async function writeIntoMd(input: any) {
  const filePath = path.join(__dirname, "..", "..", "README.md");

  const content =
    typeof input === "string"
      ? input
      : (input?.content ?? JSON.stringify(input, null, 2));

  await fs.appendFile(filePath, `\n\n${content}\n`, "utf8");

  return {
    data: content,
    source: "writeIntoMd",
    status: "success",
  } as const;
}
