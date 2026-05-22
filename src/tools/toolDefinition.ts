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
    description:
      "Extrait, nettoie et résume le contenu textuel d'une page web à partir d'une URL. Supprime le HTML inutile (scripts, styles, navigation) et retourne uniquement le texte exploitable.",
    params: {
      linkPage:
        "URL STRICTE et obligatoire. Doit être une chaîne valide commençant par http:// ou https://. Exemple: https://example.com/article. Ne jamais envoyer autre chose qu'une URL.",
    },
  },
  {
    name: "runRequest",
    file: "runRequest.ts",
    description:
      "Exécute une requête IA autonome pour répondre, analyser ou générer du contenu structuré. Utilisé pour les questions générales, la génération de texte ou l'enrichissement d'informations.",
    params: {
      query:
        "Question ou instruction claire sous forme de texte. DOIT être une string unique, pas un objet. Exemple: 'Explique la photosynthèse simplement'.",
      skill:
        "Optionnel. Nom d'une compétence spécialisée définie dans skillDefinition. Utilisé pour modifier le style ou le ton de la réponse (ex: marseillais, verlan, formel).",
    },
  },
  {
    name: "writeIntoMd",
    file: "writeIntoMd.ts",
    description:
      "Écrit du contenu structuré dans un fichier Markdown. Toujours utilisé en dernier step du pipeline pour sauvegarder le résultat final.",
    params: {
      content:
        "Texte Markdown complet. DOIT inclure des titres formatés avec ##. Peut inclure des sections, listes et structure claire. Exemple: '## Résultat\nContenu ici...'",
    },
  },
  {
    name: "pdfWriter",
    file: "pdfWriter.ts",
    description:
      "Exécute dynamiquement du code JavaScript généré par l'IA dans un environnement sandbox sécurisé. Peut être utilisé pour générer des PDF, transformer des données, faire des calculs complexes ou automatiser des traitements. Le code est exécuté dans une VM isolée avec des objets contrôlés.",
    params: {
      code: `
Code JavaScript STRICTEMENT valide à exécuter.
Le code doit être autonome et directement exécutable.
Le code peut utiliser uniquement les objets exposés dans le sandbox.

Variables disponibles dans le sandbox :
- pdfDoc
- font
- rgb
- console

Le code peut :
- créer des pages PDF
- écrire du texte
- retourner une valeur

Le code doit utiliser 'return' pour retourner un résultat final.

Exemple valide :

const page = pdfDoc.addPage([600, 800]);

page.drawText("Bonjour PDF", {
  x: 50,
  y: 750,
  size: 20,
  font,
});

et une fois fait reverifie que le PDF est bien généré et sauvegardé, si c'est le cas

return "PDF généré avec succès";


`,
    },
  },
];

export default toolDefinition;
