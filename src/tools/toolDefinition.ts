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
Génère uniquement du JavaScript valide exécutable dans une sandbox sécurisée.

OBJECTIF :
Créer un PDF propre, lisible et bien structuré.

CONTRAINTES :
- Retourner uniquement du JavaScript brut
- Aucun markdown
- Aucun texte explicatif
- Aucun import/export/require
- Aucun accès à process, fs, Bun, global ou window
- Aucun code dangereux ou infini
- Toujours terminer par un return final

VARIABLES DISPONIBLES :
- pdfDoc
- font
- rgb
- console

CAPACITÉS AUTORISÉES :
- créer des pages PDF
- écrire du texte
- styliser le texte
- organiser le contenu
- créer plusieurs sections
- créer plusieurs pages si nécessaire

RÈGLES PDF :
- Toujours créer au moins une page
- Toujours garder une mise en page lisible
- Toujours gérer les espacements verticaux correctement
- Éviter tout chevauchement de texte
- Utiliser maxWidth pour les longs paragraphes
- Utiliser lineHeight pour les textes multilignes
- Le texte ne doit jamais sortir de la page
- Si le contenu devient trop long, créer une nouvelle page
- Ne jamais utiliser de syntaxe Markdown dans le PDF

VALIDATION :
- Vérifier que le PDF contient du contenu
- Vérifier que le PDF peut être sauvegardé correctement

SUCCÈS :
return "PDF généré avec succès";

ERREUR :
throw new Error("Erreur lors de la génération du PDF");
`,
    },
  },
];

export default toolDefinition;
