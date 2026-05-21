export default async function fetchIa(
  model: string,
  messages: Array<{ role: string; content: string }>,
) {
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages,
    }),
  });
  const response = await res.json();
  const contentResponse = response.choices?.[0]?.message?.content;
  if (!contentResponse) {
    console.error(
      "Réponse inattendue de l'API :",
      JSON.stringify(response, null, 2),
    );
    throw new Error("Réponse inattendue de l'API");
  }
  return contentResponse;
}
