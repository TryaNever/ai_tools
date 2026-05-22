import path from "node:path";
import fs from "node:fs/promises";
import CONFIG from "../../config";

export default async function saveMemory(input: any) {
  const filePath = path.join(process.cwd(), "src", "memory", "MEMORY.md");

  const content =
    typeof input === "string"
      ? input
      : (input?.content ?? JSON.stringify(input, null, 2));

  // créer dossier si besoin
  await fs.mkdir(path.dirname(filePath), { recursive: true });

  // lire ancien contenu
  let existing = "";
  try {
    existing = await fs.readFile(filePath, "utf8");
  } catch {
    existing = "";
  }

  const lines = existing.split("\n").filter(Boolean);

  // ajouter nouvelle entrée
  lines.push(content);

  // limiter à 400 lignes (garde les plus récentes)
  const trimmed = lines.slice(-CONFIG.MEMORY.LINE_LIMIT);

  // réécrire fichier
  await fs.writeFile(filePath, trimmed.join("\n"), "utf8");

  return {
    data: content,
    lines: trimmed.length,
    status: "success",
  } as const;
}
