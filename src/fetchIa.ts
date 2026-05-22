export default async function fetchIa(
  model: string,
  messages: Array<{ role: string; content: string }>,
) {
  try {
    const res = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages,
        }),
      },
    );

    const response = await res.json();

    // Gestion des erreurs API
    if (!res.ok) {
      const errorMessage =
        response?.error?.message || "Erreur inconnue de l'API";

      // Plus de tokens / quota dépassé
      if (
        errorMessage.toLowerCase().includes("quota") ||
        errorMessage.toLowerCase().includes("rate limit") ||
        errorMessage.toLowerCase().includes("tokens") ||
        res.status === 429
      ) {
        throw new Error(
          "Limite de tokens atteinte ou quota dépassé.",
        );
      }

      throw new Error(errorMessage);
    }

    const contentResponse = response.choices?.[0]?.message?.content;

    if (!contentResponse) {
      console.error(
        "Réponse inattendue de l'API :",
        JSON.stringify(response, null, 2),
      );

      throw new Error("Réponse inattendue de l'API");
    }

    return contentResponse;
  } catch (error) {
    console.error("Erreur fetchIa :", error);

    if (error instanceof Error) {
      throw new Error(error.message);
    }

    throw new Error("Erreur inconnue.");
  }
}