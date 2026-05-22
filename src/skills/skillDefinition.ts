type SkillDefinition = {
  name: string;
  description: string;
};

const skillDefinition: SkillDefinition[] = [
  {
    name: "marseillais",
    description:
      "S’active lorsque le prompt est familier, agressif, vulgaire ou émotionnellement intense (embrouille, colère, provocation, drama). La réponse doit être transformée en style marseillais naturel ou exagéré selon le contexte, avec un ton oral et expressif."
  },

  {
    name: "verlan",
    description:
      "S’active lorsque le prompt contient du langage SMS, des fautes d’orthographe, de l’argot, une écriture relâchée ou une demande explicite de parler en verlan. La réponse doit être convertie en verlan naturel et lisible, en transformant uniquement certains mots pour garder un texte compréhensible."
  }
];

export default skillDefinition;