import generatePlan from "./generatePlan";
import * as tools from "./tools/tools";
import type { PipelineContext, ToolResult } from "./type";

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────



type Instruction = {
  tool: keyof typeof tools;
  input?: Record<string, any>;
  skill?: string;
};

// ─────────────────────────────────────────────
// PLACEHOLDERS
// ─────────────────────────────────────────────

const PLACEHOLDER_REGEX =
  /\{\{(\w+)\.(\w+)\}\}/g;

function replaceStringPlaceholders(
  value: string,
  context: PipelineContext,
) {
  return value.replace(
    PLACEHOLDER_REGEX,
    (_, toolName, field) => {
      const result = context[toolName];

      if (!result) {
        return `[MISSING:${toolName}]`;
      }

      const fieldValue = (result as Record<string, unknown>)[field];

      if (fieldValue == null) {
        return `[MISSING:${toolName}.${field}]`;
      }

      return typeof fieldValue === "string"
        ? fieldValue
        : JSON.stringify(fieldValue);
    },
  );
}

function resolvePlaceholders(
  value: any,
  context: PipelineContext,
): any {
  if (typeof value === "string") {
    return replaceStringPlaceholders(
      value,
      context,
    );
  }

  if (Array.isArray(value)) {
    return value.map((item) =>
      resolvePlaceholders(item, context),
    );
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(
        ([key, val]) => [
          key,
          resolvePlaceholders(val, context),
        ],
      ),
    );
  }

  return value;
}

// ─────────────────────────────────────────────
// TOOLS
// ─────────────────────────────────────────────

function getTool(
  toolName: keyof typeof tools,
) {
  const tool = tools[toolName];

  if (!tool) {
    throw new Error(
      `Tool inconnu : "${toolName}"`,
    );
  }

  return tool;
}

async function runTool(
  instruction: Instruction,
  context: PipelineContext,
): Promise<ToolResult> {
  const tool = getTool(instruction.tool);

  const input = resolvePlaceholders(
    {
      ...instruction.input,
      skill: instruction.skill,
    },
    context,
  );

  try {
    const result = await tool({
      ...input,
      _context:
        Object.keys(context).length > 0
          ? context
          : undefined,
    });

    return (
      result ?? {
        data: null,
        source: instruction.tool,
        status: "error",
        error: `${instruction.tool} n'a rien retourné`,
      }
    );
  } catch (error: any) {
    return {
      data: null,
      source: instruction.tool,
      status: "error",
      error:
        error?.message ??
        "Erreur inconnue",
    };
  }
}

// ─────────────────────────────────────────────
// PIPELINE
// ─────────────────────────────────────────────

async function executeStep(
  instruction: Instruction,
  context: PipelineContext,
  index: number,
  total: number,
) {
  console.log(
    `\n▶ Step ${index + 1}/${total} — ${instruction.tool}`,
  );

  const result = await runTool(
    instruction,
    context,
  );

  context[instruction.tool] = result;

  console.log(
    `✅ ${instruction.tool} → ${result.status}`,
  );

  if (result.status === "error") {
    console.warn(
      `⚠️ ${result.error}`,
    );
  }

  return result;
}

// ─────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────

export default async function loopReact(
  command: string,
) {
  await import("./tools/toolDefinition");

  const instructions =
    await generatePlan(command);

  console.log(
    "📋 Plan généré :",
    JSON.stringify(instructions, null, 2),
  );

  const context: PipelineContext = {};

  for (let i = 0;i < instructions.length;i++) {
    const result = await executeStep(
      instructions[i],
      context,
      i,
      instructions.length,
    );

    if (result.status === "error") {
      break;
    }
  }

  console.log("\n🎉 Pipeline terminé.");

  return context;
}