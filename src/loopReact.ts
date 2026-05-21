import fetchIa from "./fetchIa";
import parseAIResponse from "./parseAIResponse";
import * as tools from "./tools";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

type ToolResult = {
  data: string | object | null;
  source: string;
  status: "success" | "error";
  error?: string;
};

/** Contexte accumulé au fil des steps : { nomDuTool: résultat } */
type PipelineContext = Record<string, ToolResult>;

// ─────────────────────────────────────────────
// Résolution des placeholders inter-tools
//
// L'IA peut écrire dans son plan :
//   { "content": "{{recapPage.data}}" }
//   { "query":   "Résume ceci : {{recapPage.data}}" }
//
// loopReact remplace ces tokens par la valeur réelle
// issue du step précédent avant d'appeler le tool.
// ─────────────────────────────────────────────

function resolvePlaceholders(input: any, context: PipelineContext): any {
  if (typeof input === "string") {
    // Remplace chaque {{toolName.field}} par la valeur du contexte
    return input.replace(/\{\{(\w+)\.(\w+)\}\}/g, (_match, toolName, field) => {
      const result = context[toolName];
      if (!result) return `[MISSING:${toolName}]`;
      const value = (result as any)[field];
      if (value === undefined || value === null)
        return `[MISSING:${toolName}.${field}]`;
      return typeof value === "string" ? value : JSON.stringify(value);
    });
  }

  if (Array.isArray(input)) {
    return input.map((item) => resolvePlaceholders(item, context));
  }

  if (typeof input === "object" && input !== null) {
    return Object.fromEntries(
      Object.entries(input).map(([key, value]) => [
        key,
        resolvePlaceholders(value, context),
      ]),
    );
  }

  return input;
}

// ─────────────────────────────────────────────
// loopReact
// ─────────────────────────────────────────────

export default async function loopReact(command: string) {
  const toolDefinition = await import("./tools/toolDefinition");

  // ── Prompt système ─────────────────────────────────────────────────────────
  //
  // IMPORTANT — SYSTÈME DE PLACEHOLDERS
  // Pour passer des données d'un step à l'autre, utilise la syntaxe :
  //   {{nomDuTool.data}}
  // Exemple : si le step 1 est "recapPage", le step 2 peut écrire :
  //   { "query": "Analyse ce contenu : {{recapPage.data}}" }
  // Et writeIntoMd peut écrire :
  //   { "content": "{{runRequest.data}}" }
  //
  const systemPrompt = `TU ES UN ORCHESTRATEUR D'OUTILS STRICT.

TA SEULE FONCTION :
- Analyser la demande utilisateur
- Planifier les tools à appeler dans l'ordre logique
- Retourner UNIQUEMENT du JSON STRICTEMENT VALIDE

========================
RÈGLE ABSOLUE
========================
- JSON ONLY — aucun texte hors JSON
- jamais de markdown, jamais de backticks
- jamais de texte libre, jamais de placeholder inventé
- input.content = STRING OBLIGATOIRE (jamais un objet)

========================
PASSAGE DE DONNÉES ENTRE STEPS
========================
Pour transmettre la sortie d'un step au step suivant, utilise la syntaxe :
  {{nomDuTool.data}}

Exemples :
  Step 1 → tool: "recapPage"   → récupère le contenu d'une URL
  Step 2 → tool: "runRequest"  → input: { "query": "Analyse et résume : {{recapPage.data}}" }
  Step 3 → tool: "writeIntoMd" → input: { "content": "{{runRequest.data}}" }

Si recapPage est inutile (pas d'URL) :
  Step 1 → tool: "runRequest"  → input: { "query": "..." }
  Step 2 → tool: "writeIntoMd" → input: { "content": "{{runRequest.data}}" }

========================
PIPELINE OBLIGATOIRE
========================
1. recapPage (si URL fournie) → récupère le contenu brut
2. runRequest (si traitement IA nécessaire) → analyse / rédige
3. writeIntoMd → écrit le résultat final

========================
WRITE INTO MD
========================
- Dernier step OBLIGATOIRE
- input.content = string avec titres ## Markdown
- Utilise {{runRequest.data}} ou {{recapPage.data}} pour injecter les données

========================
RUNREQUEST
========================
- Exécute une requête IA sur un sujet ou des données
- input.query = string (question ou instruction claire)
- Peut référencer des données précédentes via {{toolName.data}}

========================
MODE ERREUR
========================
Si info manquante ou ambiguïté :
→ 1 seul step : writeIntoMd avec message d'erreur clair

========================
RÈGLES
========================
- max 5 steps
- dernier step = writeIntoMd
- ordre logique strict, aucun step inutile

OUTILS DISPONIBLES :
${JSON.stringify(toolDefinition, null, 2)}`;

  // ── Appel IA pour générer le plan ──────────────────────────────────────────

  const response = await fetchIa("llama-3.3-70b-versatile", [
    { role: "system", content: systemPrompt },
    { role: "user", content: command },
  ]);

  const rawContent =
    response?.choices?.[0]?.message?.content ??
    response?.message?.content ??
    response;

  // Juste après l'appel fetchIa
  console.log("🔴 RAW response:", JSON.stringify(response, null, 2));
  console.log("🔴 RAW content:", rawContent);

  const result = parseAIResponse(
    typeof rawContent === "string" ? rawContent : JSON.stringify(rawContent),
  );

  console.log("🔴 Parsed result:", JSON.stringify(result, null, 2));

  if (!result || !Array.isArray(result.instructions)) {
    console.error("INVALID RESULT:", result);
    throw new Error("Réponse IA invalide (instructions manquantes)");
  }

  console.log("📋 Plan généré :", JSON.stringify(result.instructions, null, 2));

  // ── Exécution des steps avec passage de contexte ───────────────────────────

  const context: PipelineContext = {};

  for (let i = 0; i < result.instructions.length; i++) {
    const el = result.instructions[i];

    console.log(
      `\n▶ Step ${i + 1}/${result.instructions.length} — tool: ${el.tool}`,
    );

    const toolFn = tools[el.tool as keyof typeof tools];
    if (!toolFn) {
      throw new Error(`Tool inconnu : "${el.tool}"`);
    }

    // 1. Résoudre les placeholders {{toolName.data}} dans l'input
    const resolvedInput = resolvePlaceholders(el.input ?? {}, context);

    // 2. Injecter le contexte complet pour que le tool y accède si besoin
    const inputWithContext = {
      ...resolvedInput,
      _context: Object.keys(context).length > 0 ? context : undefined,
    };

    // 3. Appeler le tool
    const toolResult: ToolResult = (await toolFn(inputWithContext)) ?? {
      data: null,
      source: el.tool,
      status: "error" as const,
      error: `${el.tool} n'a rien retourné (return manquant ?)`,
    };
    // 4. Stocker le résultat dans le contexte pour les steps suivants
    context[el.tool] = toolResult;

    console.log(`✅ [${el.tool}] status: ${toolResult.status}`);
    if (toolResult.status === "error") {
      console.warn(`⚠️  [${el.tool}] error: ${toolResult.error}`);
    }
  }

  console.log("\n🎉 Pipeline terminé.");
  return context;
}
