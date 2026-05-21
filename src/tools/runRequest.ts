import fetchIa from "../fetchIa";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

type RunRequestInput = {
  query: string;
  /** Injecté automatiquement par loopReact — contient les résultats des steps précédents */
  _context?: Record<string, ToolResult>;
};

type ToolResult = {
  data: string | object | null;
  source: string;
  status: "success" | "error";
  error?: string;
};

// ─────────────────────────────────────────────
// runRequest
// ─────────────────────────────────────────────

export default async function runRequest(
  input: RunRequestInput,
): Promise<ToolResult> {
  // Normalisation défensive de l'input
  const rawQuery = typeof input === "string" ? input : (input?.query ?? null);

  if (!rawQuery || typeof rawQuery !== "string" || !rawQuery.trim()) {
    return {
      data: null,
      source: "runRequest",
      status: "error",
      error: "Requête invalide ou vide fournie à runRequest.",
    };
  }

  // Construction du contexte des steps précédents
  const contextBlock =
    input._context && Object.keys(input._context).length > 0
      ? `\n\n---\nDONNÉES DES ÉTAPES PRÉCÉDENTES (utilise-les si pertinent) :\n${JSON.stringify(
          input._context,
          null,
          2,
        )}\n---`
      : "";

  try {
    const response = await fetchIa("llama-3.3-70b-versatile", [
      {
        role: "system",
        content: `Tu es un assistant expert chargé de traiter des requêtes et de produire du contenu clair, factuel et bien structuré.
Tu réponds directement à la demande, sans introduction inutile.
Tu utilises les données des étapes précédentes si elles sont disponibles et pertinentes.${contextBlock}`,
      },
      {
        role: "user",
        content: rawQuery.trim(),
      },
    ]);

    const content: string =
      response?.choices?.[0]?.message?.content ??
      response?.message?.content ??
      (typeof response === "string" ? response : JSON.stringify(response));

    if (!content) {
      return {
        data: null,
        source: "runRequest",
        status: "error",
        error: "Réponse vide reçue de l'IA.",
      };
    }

    return {
      data: content,
      source: "runRequest",
      status: "success",
    };
  } catch (err: any) {
    return {
      data: null,
      source: "runRequest",
      status: "error",
      error: err?.message ?? "Erreur inconnue dans runRequest.",
    };
  }
}
