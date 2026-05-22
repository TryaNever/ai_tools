type ToolDefinition = {
  name: string;
  file: string;
  description: string;
  params?: Record<string, string>;
};

const toolDefinition: ToolDefinition[] = [
  {
    name: "recapPage",
    file: "recapPage.ts",
    description: "Récapitule le contenu d'une page web à partir de son URL.",
    params: {
      linkPage:
        "URL complète de la page à analyser et valide si url inconnu faire une rapport avec writeIntoMd",
    },
  },
  {
    name: "runRequest",
    file: "runRequest.ts",
    description:
      "Exécute une requête simple, répond à une question ou rédige un texte.",
    params: {
      input:
        "Question claire ou instruction précise à exécuter",
      skill: "Optionnel : nom d'une compétence spécifique à activer pour cette requête (ex: marseillais, verlan, etc.) il est visible dans skillDefinition et si tu vois que le prompt ce rapproche de c instructuction ajoute son name dans skillDefinition pour que je puisse l'utiliser automatiquement dans le futur",
    },
  },
  {
    name: "writeIntoMd",
    file: "writeIntoMd.ts",
    description:
      "Écrit du contenu dans un fichier Markdown. Le contenu doit toujours contenir des titres formatés avec ##.",
    params: {
      content: "Contenu Markdown brut à écrire",
    },
  },
];

export default toolDefinition;
