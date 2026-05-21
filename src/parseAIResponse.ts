export default function parseAIResponse(content: string) {
  try {
    const cleaned = content
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    const parsed = JSON.parse(cleaned);

    // L'IA peut retourner un array directement OU { instructions: [...] }
    const instructions = Array.isArray(parsed)
      ? parsed
      : Array.isArray(parsed?.instructions)
        ? parsed.instructions
        : null;

    if (!instructions || instructions.length === 0) {
      return {
        instructions: [],
        success: { status: false, message: "Invalid AI format" },
      };
    }

    return {
      instructions,
      success: { status: true, message: "OK" },
    };
  } catch (e) {
    return {
      instructions: [],
      success: { status: false, message: "JSON parsing failed" },
    };
  }
}
