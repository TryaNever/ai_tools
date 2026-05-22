# 📋 Code Review - Structure et Réutilisabilité

## 🎯 Résumé Exécutif
Votre codebase montre une **bonne architecture générale** avec une structure modulaire claire. Cependant, il y a plusieurs points d'amélioration concernant la **réutilisabilité**, la **gestion des erreurs** et les **types TypeScript**.

---

## ⚠️ Problèmes Majeurs

### 1. **Type Safety Faible - Les `any` partout** 🔴
**Fichiers affectés:** `loopReact.ts`, `runRequest.ts`, `parseAIResponse.ts`

```typescript
// ❌ MAUVAIS - runRequest.ts ligne 39
const skillModule = await import(`../skills/${skill}`);
skillInstruction = skillModule?.default ??
  `Utilise la compétence "${skill}" pour traiter la requête.`;

// ❌ MAUVAIS - parseAIResponse.ts ligne 39
(step: any) => {
  if (step?.tool && step?.input !== undefined) {
    return { tool: step.tool, input: step.input };
  }
  // ...
}
```

**Impact:** Perte de l'autocomplétion IDE, risque de bugs runtime non détectés.

**Solution:**
```typescript
// ✅ BON
interface ParsedInstruction {
  tool: string;
  input?: Record<string, unknown>;
  params?: Record<string, unknown>;
  name?: string;
}

function normalizeInstruction(step: ParsedInstruction): NormalizedInstruction {
  if (step.tool && step.input !== undefined) {
    return { tool: step.tool, input: step.input };
  }
  // ...
}
```

---

### 2. **Duplication de Code - Type `ToolResult`** 🟡
**Fichiers:** `loopReact.ts`, `runRequest.ts`, `recapPage.ts`

Le type `ToolResult` est défini **3 fois** différemment:
```typescript
// loopReact.ts
type ToolResult = {
  data: string | object | null;
  source: string;
  status: "success" | "error";
  error?: string;
};

// runRequest.ts
type ToolResult = {
  data: string | object | null;
  source: string;
  status: "success" | "error";
  error?: string;
};

// recapPage.ts
type ToolResult = {
  data: string | object | null;
  source: string;
  status: "success" | "error";
  error?: string;
};
```

**Impact:** Maintenance difficile, risque d'incohérence.

**Solution:** Créer un fichier `src/types.ts`:
```typescript
// types.ts
export type ToolResult = {
  data: string | object | null;
  source: string;
  status: "success" | "error";
  error?: string;
};

export type PipelineContext = Record<string, ToolResult>;
```

Puis importer partout:
```typescript
import { ToolResult, PipelineContext } from "../types";
```

---

### 3. **Manque de Validation des Entrées** 🔴
**Fichier:** `recapPage.ts`

```typescript
// ❌ MAUVAIS
export default async function recapPage(
  linkPage: string,
): Promise<ToolResult> {
  const dataBrut = await fetchData(linkPage);
  // Pas de validation que linkPage est une URL valide!
}
```

**Solution:**
```typescript
// ✅ BON
function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export default async function recapPage(
  input: { linkPage?: string }
): Promise<ToolResult> {
  if (!input.linkPage || typeof input.linkPage !== "string") {
    return {
      data: null,
      source: "recapPage",
      status: "error",
      error: "linkPage est manquant ou invalide.",
    };
  }

  if (!isValidUrl(input.linkPage)) {
    return {
      data: null,
      source: "recapPage",
      status: "error",
      error: `URL invalide: ${input.linkPage}`,
    };
  }

  const dataBrut = await fetchData(input.linkPage);
  // ...
}
```

---

### 4. **Pattern Inconsistent entre les Tools** 🟡
**Fichiers:** `recapPage.ts` vs `runRequest.ts`

- `recapPage` prend un **string direct**
- `runRequest` prend un **objet `{ query, _context, skill }`**

```typescript
// ❌ MAUVAIS - Inconsistent
export default async function recapPage(linkPage: string) { }
export default async function runRequest(input: RunRequestInput) { }
```

**Solution:** Standardiser sur un objet d'entrée:
```typescript
// ✅ BON
interface RecapPageInput {
  linkPage: string;
  _context?: PipelineContext;
}

interface RunRequestInput {
  query: string;
  skill?: string;
  _context?: PipelineContext;
}

export default async function recapPage(input: RecapPageInput): Promise<ToolResult> { }
export default async function runRequest(input: RunRequestInput): Promise<ToolResult> { }
```

Cela permet à `executeTool` de les appeler **uniformément**:
```typescript
async function executeTool(
  instruction: Instruction,
  context: PipelineContext,
): Promise<ToolResult> {
  const toolFn = tools[instruction.tool as keyof typeof tools];
  if (!toolFn) throw new Error(`Tool inconnu: ${instruction.tool}`);

  const resolvedInput = resolvePlaceholders(instruction.input ?? {}, context);
  return toolFn({ ...resolvedInput, _context: context });
}
```

---

### 5. **Gestion d'Erreur Basique** 🟡
**Fichier:** `fetchIa.ts`

```typescript
// ⚠️ PROBLÈME
if (
  errorMessage.toLowerCase().includes("quota") ||
  errorMessage.toLowerCase().includes("rate limit") ||
  errorMessage.toLowerCase().includes("tokens") ||
  res.status === 429
) {
  throw new Error("Limite de tokens atteinte ou quota dépassé.");
}
```

**Problème:** Les messages d'erreur de Groq peuvent changer. Pas de retry logic.

**Solution:**
```typescript
// ✅ BON - avec retry logic
interface RetryConfig {
  maxRetries: number;
  delayMs: number;
  backoffMultiplier: number;
}

async function fetchIaWithRetry(
  model: string,
  messages: Message[],
  retryConfig: RetryConfig = { maxRetries: 3, delayMs: 1000, backoffMultiplier: 2 }
) {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < retryConfig.maxRetries; attempt++) {
    try {
      return await fetchIa(model, messages);
    } catch (error) {
      lastError = error as Error;
      
      if (attempt < retryConfig.maxRetries - 1) {
        const delay = retryConfig.delayMs * Math.pow(retryConfig.backoffMultiplier, attempt);
        console.warn(`Retry ${attempt + 1}/${retryConfig.maxRetries} after ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError;
}
```

---

### 6. **String Matching Fragile** 🔴
**Fichier:** `systemPrompt.ts`

```typescript
// ❌ TRÈS MAUVAIS - String manuelle insérée dans le prompt
const systemPrompts = systemPrompt();
const response = await fetchIa("llama-3.3-70b-versatile", [
  {
    role: "system",
    content: systemPrompts,
  },
  // ...
]);
```

Le modèle `"llama-3.3-70b-versatile"` est **hardcodé** partout. Et le système prompt contient du JSON brut concaténé.

**Solution:**
```typescript
// ✅ BON
export const CONFIG = {
  MODEL: process.env.AI_MODEL || "llama-3.3-70b-versatile",
  MAX_RETRIES: 3,
} as const;

async function generatePlan(command: string): Promise<Instruction[]> {
  const systemPrompts = buildSystemPrompt();
  const response = await fetchIa(CONFIG.MODEL, [
    { role: "system", content: systemPrompts },
    { role: "user", content: command },
  ]);
  // ...
}
```

---

### 7. **`resolvePlaceholders` Non Réutilisable** 🟡
**Fichier:** `loopReact.ts`

```typescript
// ❌ MAUVAIS - Fonction nesting complexe + manque de test
function resolvePlaceholders(
  input: any,
  context: PipelineContext,
): any {
  if (typeof input === "string") {
    return input.replace(
      /\{\{(\w+)\.(\w+)\}\}/g,
      (_match, toolName, field) => {
        // ...
      },
    );
  }
  // 3 autres cas imbriqués
}
```

**Problème:** 
- Complexe à tester indépendamment
- Pas de gestion des placeholders imbriqués
- Pas de escape de caractères spéciaux

**Solution:**
```typescript
// ✅ BON - Créer src/utils/placeholder.ts
export interface PlaceholderConfig {
  strict: boolean; // Fail si placeholder manquant vs remplacer par [MISSING]
  format: "mustache" | "bracket"; // {{name}} vs [name]
}

export function resolvePlaceholders(
  input: unknown,
  context: Record<string, ToolResult>,
  config: PlaceholderConfig = { strict: false, format: "mustache" }
): unknown {
  if (typeof input === "string") {
    return replacePlaceholders(input, context, config);
  }
  if (Array.isArray(input)) {
    return input.map(item => resolvePlaceholders(item, context, config));
  }
  if (input !== null && typeof input === "object") {
    return Object.fromEntries(
      Object.entries(input).map(([key, value]) => [
        key,
        resolvePlaceholders(value, context, config),
      ])
    );
  }
  return input;
}

function replacePlaceholders(
  text: string,
  context: Record<string, ToolResult>,
  config: PlaceholderConfig
): string {
  const regex = /\{\{(\w+)\.(\w+)\}\}/g;
  
  return text.replace(regex, (match, toolName, field) => {
    const toolResult = context[toolName];
    
    if (!toolResult) {
      if (config.strict) throw new Error(`Tool "${toolName}" not found in context`);
      return `[MISSING:${toolName}]`;
    }
    
    const value = (toolResult as any)[field];
    
    if (value === undefined || value === null) {
      if (config.strict) throw new Error(`Field "${field}" not found in tool result`);
      return `[MISSING:${toolName}.${field}]`;
    }
    
    return typeof value === "string" ? value : JSON.stringify(value);
  });
}

// Tests faciles
describe("resolvePlaceholders", () => {
  it("should replace simple placeholder", () => {
    const context = { tool1: { data: "hello", source: "test", status: "success" } };
    const result = resolvePlaceholders("{{tool1.data}}", context);
    expect(result).toBe("hello");
  });
});
```

---

### 8. **Pas de Configuration Centralisée** 🟡
**Fichiers:** Partout

```typescript
// ❌ Hardcodé
const filePath = path.join(__dirname, "..", "..", "README.md");

// ❌ Hardcodé
"https://api.groq.com/openai/v1/chat/completions"

// ❌ Hardcodé
"llama-3.3-70b-versatile"
```

**Solution:** Créer `src/config.ts`:
```typescript
// config.ts
export const CONFIG = {
  API: {
    GROQ_URL: process.env.GROQ_API_URL || "https://api.groq.com/openai/v1/chat/completions",
    MODEL: process.env.AI_MODEL || "llama-3.3-70b-versatile",
    TIMEOUT_MS: Number(process.env.API_TIMEOUT_MS || "30000"),
  },
  OUTPUT: {
    README_PATH: path.resolve(process.cwd(), "README.md"),
    MAX_CHARS: Number(process.env.MAX_CHARS || "1000"),
  },
  RETRY: {
    MAX_ATTEMPTS: 3,
    DELAY_MS: 1000,
  },
} as const;
```

---

## 🟡 Problèmes Mineurs

### 9. **Typage de Callback Générique** 
**Fichier:** `loopReact.ts` ligne 104

```typescript
// ❌ MAUVAIS
const toolFn = tools[instruction.tool as keyof typeof tools];

// ✅ BON
const toolFn = getToolFunction(instruction.tool);

function getToolFunction(toolName: string): ToolFunction {
  const fn = tools[toolName as keyof typeof tools];
  if (!fn) throw new Error(`Tool not found: ${toolName}`);
  return fn;
}
```

---

### 10. **Extraction de Contenu Fragile**
**Fichier:** `generatePlan.ts` ligne 23

```typescript
// ❌ MAUVAIS - Trop de fallbacks
const rawContent =
  response?.choices?.[0]?.message?.content ??
  response?.message?.content ??
  response;
```

**Mieux:** Créer une fonction dédiée:
```typescript
// ✅ BON
function extractResponseContent(response: unknown): string {
  if (typeof response === "string") return response;
  
  if (response && typeof response === "object") {
    const obj = response as Record<string, unknown>;
    
    // Groq API format
    if (Array.isArray(obj.choices) && obj.choices[0]) {
      const content = (obj.choices[0] as any)?.message?.content;
      if (typeof content === "string") return content;
    }
    
    // Alternative format
    if (typeof obj.message?.content === "string") {
      return obj.message.content;
    }
  }
  
  throw new Error("Could not extract content from API response");
}
```

---

### 11. **Logs de Debug Partout** 🟡
**Fichier:** `loopReact.ts`

```typescript
// ❌ MAUVAIS - Logs mélangés
console.log(instructions);
console.log("📋 Plan généré :", JSON.stringify(instructions, null, 2));
```

**Solution:** Créer un logger:
```typescript
// ✅ BON - src/logger.ts
export const logger = {
  debug: (msg: string, data?: unknown) => {
    if (process.env.DEBUG) {
      console.log(`[DEBUG] ${msg}`, data);
    }
  },
  info: (msg: string, data?: unknown) => {
    console.log(`[INFO] ${msg}`, data);
  },
  warn: (msg: string, error?: Error) => {
    console.warn(`[WARN] ${msg}`, error?.message);
  },
  error: (msg: string, error?: Error) => {
    console.error(`[ERROR] ${msg}`, error?.message);
  },
};

// Usage
logger.info("Plan généré", { steps: instructions.length });
```

---

## ✅ Points Positifs

1. **Architecture modulaire claire** - Chaque tool a sa responsabilité
2. **Pattern ReAct bien structuré** - Pipeline clair avec contexte
3. **Séparation des concerns** - Tools, skills, systemPrompt séparés
4. **Gestion des placeholders** - Système flexible pour passer les données

---

## 📊 Tableau de Priorités

| Problème | Sévérité | Effort | Priorité |
|----------|----------|--------|----------|
| Type Safety (any everywhere) | 🔴 Critique | 4h | 1 |
| Duplication ToolResult | 🟡 Moyen | 30min | 2 |
| Validation entrées | 🔴 Critique | 1h | 3 |
| Pattern inconsistent | 🟡 Moyen | 2h | 4 |
| Gestion erreurs (retry) | 🟡 Moyen | 1.5h | 5 |
| Config centralisée | 🟡 Moyen | 1h | 6 |
| Logger séparé | 🟠 Bas | 30min | 7 |

---

## 🎯 Actions Recommandées

### Phase 1 (Urgent - 30 min)
1. Créer `src/types.ts` - Exporter types réutilisables
2. Créer `src/config.ts` - Centraliser configurations

### Phase 2 (Important - 2h)
3. Créer `src/utils/placeholder.ts` - `resolvePlaceholders` réutilisable
4. Créer `src/utils/validation.ts` - Validators centralisés
5. Ajouter validation dans `recapPage` et autres tools

### Phase 3 (Nice-to-have - 1.5h)
6. Créer `src/logger.ts` - Logger structuré
7. Ajouter retry logic dans `fetchIa`
8. Améliorer typage dans `tools.ts`

---

## Conclusion

Votre codebase a une **bonne fondation** mais manque de **rigueur TypeScript** et de **réutilisabilité**. Les améliorations prioritaires sont:
1. Éliminer les `any` → Types stricts
2. Centraliser les types partagés
3. Standardiser les patterns entre tools

Ces changements rendront le code **plus maintenable**, **plus testable** et **plus facile à étendre**.
