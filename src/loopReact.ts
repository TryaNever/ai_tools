import generatePlan from "./generatePlan";
import * as tools from "./tools";

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────

/**
 * Résultat standard retourné par chaque tool
 */
type ToolResult = {
  data: string | object | null;
  source: string;
  status: "success" | "error";
  error?: string;
};

/**
 * Contexte partagé entre les étapes.
 *
 * Exemple :
 * {
 *   recapPage: { data: "...", status: "success" },
 *   summarize: { data: "...", status: "success" }
 * }
 */
type PipelineContext = Record<string, ToolResult>;

// ─────────────────────────────────────────────
// REMPLACEMENT DES PLACEHOLDERS
// ─────────────────────────────────────────────

function resolvePlaceholders(
  input: any,
  context: PipelineContext,
): any {
  if (typeof input === "string") {
    return input.replace(
      /\{\{(\w+)\.(\w+)\}\}/g,
      (_match, toolName, field) => {
        const toolResult = context[toolName];

        // Tool introuvable
        if (!toolResult) {
          return `[MISSING:${toolName}]`;
        }

        // Champ introuvable
        const value = (toolResult as any)[field];

        if (value === undefined || value === null) {
          return `[MISSING:${toolName}.${field}]`;
        }

        // Si string → retourne tel quel
        if (typeof value === "string") {
          return value;
        }

        // Sinon stringify l'objet
        return JSON.stringify(value);
      },
    );
  }

  // ───────────────────────────────────────────
  // CAS 2 : ARRAY
  // ───────────────────────────────────────────
  if (Array.isArray(input)) {
    return input.map((item) =>
      resolvePlaceholders(item, context),
    );
  }

  // ───────────────────────────────────────────
  // CAS 3 : OBJECT
  // ───────────────────────────────────────────
  if (typeof input === "object" && input !== null) {
    return Object.fromEntries(
      Object.entries(input).map(([key, value]) => [
        key,
        resolvePlaceholders(value, context),
      ]),
    );
  }

  // ───────────────────────────────────────────
  // CAS 4 : PRIMITIF (number, boolean, etc.)
  // ───────────────────────────────────────────
  return input;
}


// ─────────────────────────────────────────────
// EXÉCUTION D'UN TOOL
// ─────────────────────────────────────────────

async function executeTool(
  instruction: any,
  context: PipelineContext,
): Promise<ToolResult> {
  // Récupération de la fonction du tool
  const toolFn =
    tools[instruction.tool as keyof typeof tools];

  if (!toolFn) {
    throw new Error(
      `Tool inconnu : "${instruction.tool}"`,
    );
  }

  // Remplace les placeholders {{...}}
  const resolvedInput = resolvePlaceholders(
    instruction.input ?? {},
    context,
  );

  // On injecte aussi le contexte complet
  const finalInput = {
    ...resolvedInput,
    _context:
      Object.keys(context).length > 0
        ? context
        : undefined,
  };

  // Appel du tool
  const result: any =
    (await toolFn(finalInput)) ??
    ({
      data: null,
      source: instruction.tool,
      status: "error",
      error:
        `${instruction.tool} n'a rien retourné`,
    } as const);

  return result;
}

// ─────────────────────────────────────────────
// LOOP REACT
// ─────────────────────────────────────────────

export default async function loopReact(
  command: string,
) {
  // Import gardé pour conserver le comportement actuel
  await import("./tools/toolDefinition");

  // ───────────────────────────────────────────
  // 1. GÉNÉRATION DU PLAN
  // ───────────────────────────────────────────

  const instructions = await generatePlan(
    command,
  );

  console.log(instructions);
  

  console.log(
    "📋 Plan généré :",
    JSON.stringify(instructions, null, 2),
  );

  // ───────────────────────────────────────────
  // 2. CONTEXTE GLOBAL DU PIPELINE
  // ───────────────────────────────────────────

  const context: PipelineContext = {};

  // ───────────────────────────────────────────
  // 3. EXÉCUTION DES ÉTAPES
  // ───────────────────────────────────────────

  for (
    let index = 0;
    index < instructions.length;
    index++
  ) {
    const instruction = instructions[index];

    console.log(
      `\n▶ Step ${index + 1}/${
        instructions.length
      } — tool: ${instruction.tool}`,
    );

instruction.input = {
  ...instruction.input,
  skill: instruction.skill,
};

const toolResult = await executeTool(
  instruction,
  context,
);

    // Sauvegarde du résultat dans le contexte
    context[instruction.tool] = toolResult;

    // Logs
    console.log(
      `✅ [${instruction.tool}] status: ${toolResult.status}`,
    );

    if (toolResult.status === "error") {
      console.warn(
        `⚠️ [${instruction.tool}] error: ${toolResult.error}`,
      );
      break;
    }
  }

  console.log("\n🎉 Pipeline terminé.");

  return context;
}