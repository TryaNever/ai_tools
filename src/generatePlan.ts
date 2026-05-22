import CONFIG from "../config";
import fetchWithRetry from "./fetchIaWithRetry";
import { loadMemory } from "./memory/loadMemory";
import parseAIResponse from "./parseAIResponse";
import systemPrompt from "./systemPrompt";

export default async function generatePlan(command: string) {
  const systemPrompts = systemPrompt();
  const memory = await loadMemory();

  const response = await fetchWithRetry(CONFIG.API.MODEL, [
    {
      role: "system",
      content: systemPrompts,
    },
    {
      role: "system",
      content: "MEMORY:\n" + JSON.stringify(memory.slice(-20), null, 2),
    },
    {
      role: "user",
      content: command,
    },
  ]);
  // Compatibilité selon différents formats de réponse IA
  const rawContent =
    response?.choices?.[0]?.message?.content ??
    response?.message?.content ??
    response;
  console.log(rawContent);
  const parsed = parseAIResponse(
    typeof rawContent === "string" ? rawContent : JSON.stringify(rawContent),
  );

  // Validation minimale
  if (
    !parsed ||
    !Array.isArray(parsed.instructions) ||
    parsed.instructions.length === 0 ||
    parsed.success?.status !== true
  ) {
    console.error("INVALID RESULT:", parsed);

    throw new Error("Réponse IA invalide : le plan n'a pas pu être généré.");
  }

  return parsed.instructions;
}
