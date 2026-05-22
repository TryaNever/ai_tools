export default function parseAIResponse(content: string) {
  const normalize = (text: string) =>
    text.replace(/```json/g, "").replace(/```/g, "").trim();

  const tryParse = (text: string) => {
    try {
      return JSON.parse(text);
    } catch {
      return null;
    }
  };

  const cleaned = normalize(content);
  let parsed = tryParse(cleaned);

  if (!parsed) {
    const jsonMatch = cleaned.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
    if (jsonMatch) {
      parsed = tryParse(jsonMatch[0]);
    }
  }

  const instructions = Array.isArray(parsed)
    ? parsed
    : Array.isArray(parsed?.instructions)
      ? parsed.instructions
      : Array.isArray(parsed?.steps)
        ? parsed.steps
        : null;

  if (!instructions || instructions.length === 0) {
    return {
      instructions: [],
      success: { status: false, message: "Invalid AI format" },
    };
  }

  const normalizedInstructions = instructions.map(
    (step: any) => {
      if (step?.tool && step?.input !== undefined) {
        return { tool: step.tool, input: step.input };
      }
      if (step?.tool && step?.params !== undefined) {
        return { tool: step.tool, input: step.params };
      }
      if (step?.name && step?.params !== undefined) {
        return { tool: step.name, input: step.params };
      }
      return step;
    },
  );

  return {
    instructions: normalizedInstructions,
    success: { status: true, message: "OK" },
  };
}
