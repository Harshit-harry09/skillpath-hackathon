/**
 * Unified Gemini API Client using standard REST fetches.
 * Highly robust, lightweight, handles errors, key rotation, agent-group key partitioning, model fallbacks, and JSON parsing.
 */

export type GeminiModel =
  | "gemini-3.5-flash-lite"
  | "gemini-3.1-flash-lite"
  | "gemini-3-flash"
  | "gemini-3.6-flash"
  | "gemini-3.5-flash"
  | "gemini-2.5-flash"
  | "gemini-2.0-flash"
  | "gemini-1.5-flash";

export const DEFAULT_GEMINI_MODEL: GeminiModel = 'gemini-3.5-flash-lite';

export type AgentGroup = 'ingestion' | 'identity' | 'matching' | 'planning' | 'synthesis';

// Model configuration using strictly authorized models from API dashboard
const MODEL_ENDPOINTS: Record<string, string> = {
  "gemini-3.5-flash-lite": "gemini-3.5-flash-lite",
  "gemini-3.1-flash-lite": "gemini-3.1-flash-lite",
  "gemini-3-flash": "gemini-3-flash",
  "gemini-3.6-flash": "gemini-3.5-flash-lite",
  "gemini-3.5-flash": "gemini-3.5-flash-lite",
  "gemini-2.5-flash": "gemini-3.5-flash-lite",
  "gemini-2.0-flash": "gemini-3.5-flash-lite",
  "gemini-1.5-flash": "gemini-3.5-flash-lite",
};

// Key partition ranges across the 11-key pool
const AGENT_KEY_RANGES: Record<AgentGroup, [number, number]> = {
  ingestion: [0, 1],   // Keys 1 & 2 (Resume Parser, PDF OCR, Doubt Resolver)
  identity: [2, 3],    // Keys 3 & 4 (Skill Graph, Career Twin Builder)
  matching: [4, 5],    // Keys 5 & 6 (Opportunity Matcher, Critic, Adversarial Debate)
  planning: [6, 7],    // Keys 7 & 8 (Pathfinder, Learning Roadmap, Inclusion Audit)
  synthesis: [8, 10],  // Keys 9, 10 & 11 (Fake Job Guard, Future Simulator, Narrator, Crystal Ball, Doctor Agent)
};

const groupIndexes: Record<AgentGroup, number> = {
  ingestion: 0,
  identity: 0,
  matching: 0,
  planning: 0,
  synthesis: 0,
};

let globalKeyIndex = 0;

/**
 * Returns all configured API keys from environment variables.
 */
function getApiKeyPool(): string[] {
  const poolStr = process.env.GEMINI_API_KEYS || process.env.GEMINI_API_KEY || "";
  const keys = poolStr
    .split(',')
    .map((k) => k.trim().replace(/^["']|["']$/g, ''))
    .filter(Boolean);
  return keys.length > 0 ? keys : [""];
}

/**
 * Resolves the key pool for a specific agent group or falls back to the entire pool.
 */
function getGroupKeyPool(group?: AgentGroup): { keys: string[]; isGroup: boolean } {
  const allKeys = getApiKeyPool();
  if (!group || !AGENT_KEY_RANGES[group] || allKeys.length < 2) {
    return { keys: allKeys, isGroup: false };
  }

  const [start, end] = AGENT_KEY_RANGES[group];
  const slice = allKeys.slice(start, Math.min(allKeys.length, end + 1));
  if (slice.length > 0) {
    return { keys: slice, isGroup: true };
  }
  return { keys: allKeys, isGroup: false };
}

export interface CallGeminiOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  jsonMode?: boolean;
  responseSchema?: unknown;
  timeoutMs?: number;
  agentGroup?: AgentGroup;
}

/**
 * Send a prompt to Gemini and return the text response.
 * Uses assigned Agent-Group API Key Pools for maximum throughput and 0 parallel collisions.
 */
export async function callGemini(
  systemPrompt: string,
  userMessage: string,
  options?: CallGeminiOptions
): Promise<string> {
  const allKeysPool = getApiKeyPool();

  if (!allKeysPool[0]) {
    throw new Error("GEMINI_API_KEY is not set in environment variables.");
  }

  const { keys: targetKeysPool, isGroup } = getGroupKeyPool(options?.agentGroup);
  const groupName = options?.agentGroup;

  const requestedModel = (options?.model && MODEL_ENDPOINTS[options.model]) ? options.model : "gemini-3.5-flash-lite";
  const primaryModel = MODEL_ENDPOINTS[requestedModel] || "gemini-3.5-flash-lite";
  const modelsToTry = Array.from(new Set([primaryModel, "gemini-3.5-flash-lite", "gemini-3.1-flash-lite", "gemini-3-flash"]));

  const temperature = options?.temperature ?? 0.2;
  const maxTokens = options?.maxTokens ?? 2048;

  // Primary attempt using dedicated Agent-Group Key Pool
  for (let attempt = 0; attempt < targetKeysPool.length; attempt++) {
    const currentIndex = isGroup && groupName ? (groupIndexes[groupName] + attempt) % targetKeysPool.length : (globalKeyIndex + attempt) % targetKeysPool.length;
    const currentKey = targetKeysPool[currentIndex];
    const isAccessToken = currentKey.startsWith("ya29.");
    const authHeader: Record<string, string> = isAccessToken ? { Authorization: `Bearer ${currentKey}` } : {};
    const keyQuery = isAccessToken ? "" : `?key=${encodeURIComponent(currentKey)}`;

    for (const currentModel of modelsToTry) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${currentModel}:generateContent${keyQuery}`;

        const payload: any = {
          contents: [{ role: "user", parts: [{ text: userMessage }] }],
          generationConfig: { temperature, maxOutputTokens: maxTokens }
        };

        if (systemPrompt) {
          payload.systemInstruction = { parts: [{ text: systemPrompt }] };
        }
        if (options?.jsonMode) {
          payload.generationConfig.responseMimeType = "application/json";
          if (options.responseSchema) {
            payload.generationConfig.responseSchema = options.responseSchema;
          }
        }

        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json", ...authHeader },
          body: JSON.stringify(payload),
          signal: AbortSignal.timeout(options?.timeoutMs ?? 10000),
        });

        if (!res.ok) {
          const errText = await res.text();
          console.warn(`[Gemini] ${groupName ? `[${groupName.toUpperCase()} POOL]` : ''} Key / Model ${currentModel} returned HTTP ${res.status}: ${errText.substring(0, 150)}`);
          
          if (res.status === 429 || res.status === 404) {
            if (isGroup && groupName) {
              groupIndexes[groupName] = (groupIndexes[groupName] + 1) % targetKeysPool.length;
            } else {
              globalKeyIndex = (globalKeyIndex + 1) % allKeysPool.length;
            }
            break;
          }
          continue;
        }

        const data = await res.json();
        const candidate = data.candidates?.[0];
        const text = candidate?.content?.parts?.[0]?.text;

        if (text === undefined || text === null || text === "") {
          continue;
        }

        console.log(`[Gemini] ✓ ${groupName ? `[${groupName.toUpperCase()} POOL]` : 'Default'} Responded via (${currentModel})`);
        return text;
      } catch (error) {
        console.error(`[Gemini] Exception on model ${currentModel}:`, error instanceof Error ? error.message : error);
      }
    }
  }

  // Fallback attempt across ALL keys if dedicated group pool failed
  if (isGroup) {
    console.warn(`[Gemini] Dedicated pool for ${groupName} exhausted. Falling back to global key pool.`);
    for (let attempt = 0; attempt < allKeysPool.length; attempt++) {
      const currentKey = allKeysPool[(globalKeyIndex + attempt) % allKeysPool.length];
      const isAccessToken = currentKey.startsWith("ya29.");
      const authHeader: Record<string, string> = isAccessToken ? { Authorization: `Bearer ${currentKey}` } : {};
      const keyQuery = isAccessToken ? "" : `?key=${encodeURIComponent(currentKey)}`;

      for (const currentModel of modelsToTry) {
        try {
          const url = `https://generativelanguage.googleapis.com/v1beta/models/${currentModel}:generateContent${keyQuery}`;
          const res = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json", ...authHeader },
            body: JSON.stringify({
              contents: [{ role: "user", parts: [{ text: userMessage }] }],
              systemInstruction: systemPrompt ? { parts: [{ text: systemPrompt }] } : undefined,
              generationConfig: { temperature, maxOutputTokens: maxTokens, responseMimeType: options?.jsonMode ? "application/json" : undefined }
            }),
            signal: AbortSignal.timeout(options?.timeoutMs ?? 10000),
          });
          if (res.ok) {
            const data = await res.json();
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text) return text;
          }
        } catch {
          // ignore fallback retry exceptions
        }
      }
    }
  }

  throw new Error("All Gemini API keys and models failed after retries.");
}

/**
 * Call Gemini with inline binary data (e.g., base64 PDF document).
 */
export async function callGeminiMultimodal(
  systemPrompt: string,
  userMessage: string,
  inlineData: { mimeType: string; data: string },
  options?: CallGeminiOptions
): Promise<string> {
  const { keys: targetKeysPool, isGroup } = getGroupKeyPool(options?.agentGroup || 'ingestion');
  const cleanData = inlineData.data.replace(/^data:[^;]+;base64,/, '').trim();
  const modelsToTry = ["gemini-3.5-flash-lite", "gemini-3.1-flash-lite", "gemini-3-flash"];
  const temperature = options?.temperature ?? 0.2;
  const maxTokens = options?.maxTokens ?? 4096;

  for (let attempt = 0; attempt < targetKeysPool.length; attempt++) {
    const currentKey = targetKeysPool[attempt];
    const isAccessToken = currentKey.startsWith("ya29.");
    const authHeader: Record<string, string> = isAccessToken ? { Authorization: `Bearer ${currentKey}` } : {};
    const keyQuery = isAccessToken ? "" : `?key=${encodeURIComponent(currentKey)}`;

    for (const currentModel of modelsToTry) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${currentModel}:generateContent${keyQuery}`;
        const payload = {
          contents: [{ role: "user", parts: [{ inlineData: { mimeType: inlineData.mimeType, data: cleanData } }, { text: userMessage }] }],
          systemInstruction: systemPrompt ? { parts: [{ text: systemPrompt }] } : undefined,
          generationConfig: { temperature, maxOutputTokens: maxTokens, responseMimeType: options?.jsonMode ? "application/json" : undefined }
        };

        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json", ...authHeader },
          body: JSON.stringify(payload),
          signal: AbortSignal.timeout(options?.timeoutMs ?? 15000),
        });

        if (res.ok) {
          const data = await res.json();
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) return text;
        }
      } catch (err) {
        console.error(`[Gemini Multimodal] Exception on model ${currentModel}:`, err instanceof Error ? err.message : err);
      }
    }
  }

  throw new Error("Gemini multimodal PDF extraction failed across all attempts.");
}

/**
 * Call Gemini Multimodal and parse the response as JSON.
 */
export async function callGeminiJSONMultimodal<T = unknown>(
  systemPrompt: string,
  userMessage: string,
  inlineData: { mimeType: string; data: string },
  options?: CallGeminiOptions
): Promise<T> {
  const raw = await callGeminiMultimodal(systemPrompt, userMessage, inlineData, {
    ...options,
    jsonMode: true
  });

  let cleaned = raw.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
  }

  return JSON.parse(cleaned) as T;
}

/**
 * Call Gemini and parse the response as JSON.
 */
export async function callGeminiJSON<T = unknown>(
  systemPrompt: string,
  userMessage: string,
  options?: CallGeminiOptions
): Promise<T> {
  const raw = await callGemini(systemPrompt, userMessage, {
    ...options,
    jsonMode: true
  });

  let cleaned = raw.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
  }

  return JSON.parse(cleaned) as T;
}

/**
 * Batch semantic embeddings used for vector memory & semantic cache.
 */
export async function embedGeminiTexts(texts: string[]): Promise<number[][]> {
  const keysPool = getApiKeyPool();
  const apiKey = keysPool[globalKeyIndex % keysPool.length] || keysPool[0];
  if (!apiKey) throw new Error('GEMINI_API_KEY is not set in environment variables.');
  if (texts.length === 0) return [];

  const model = process.env.GEMINI_EMBEDDING_MODEL || 'text-embedding-004';
  const keyQuery = `?key=${encodeURIComponent(apiKey)}`;
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:batchEmbedContents${keyQuery}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requests: texts.map((text) => ({
          model: `models/${model}`,
          content: { parts: [{ text: text.slice(0, 2_000) }] },
          taskType: 'SEMANTIC_SIMILARITY',
        })),
      }),
      signal: AbortSignal.timeout(6_000),
    }
  );

  if (!response.ok) {
    throw new Error(`Gemini embedding request failed with HTTP ${response.status}.`);
  }
  const data = await response.json() as { embeddings?: Array<{ values?: number[] }> };
  const embeddings = data.embeddings?.map((item) => item.values || []);
  return embeddings || [];
}
