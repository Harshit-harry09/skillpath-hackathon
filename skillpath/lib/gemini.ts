/**
 * Unified Gemini API Client using standard REST fetches.
 * Highly robust, lightweight, handles errors, key rotation, model fallbacks, and JSON parsing.
 */

export type GeminiModel =
  | "gemini-3.6-flash"
  | "gemini-3.5-flash"
  | "gemini-3.5-flash-lite"
  | "gemini-2.5-flash"
  | "gemini-2.0-flash"
  | "gemini-1.5-flash";

// Map aliases to verified working models (gemini-2.5-flash)
const MODEL_ENDPOINTS: Record<string, string> = {
  "gemini-3.6-flash": "gemini-2.5-flash",
  "gemini-3.5-flash": "gemini-2.5-flash",
  "gemini-3.5-flash-lite": "gemini-2.5-flash",
  "gemini-2.5-flash": "gemini-2.5-flash",
  "gemini-2.0-flash": "gemini-2.5-flash",
  "gemini-1.5-flash": "gemini-2.5-flash",
};

let keyIndex = 0;

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
 * Send a prompt to Gemini and return the text response.
 * Rotates across the API key pool and model fallbacks on rate limit (429) or error.
 */
export async function callGemini(
  systemPrompt: string,
  userMessage: string,
  options?: {
    model?: GeminiModel;
    temperature?: number;
    maxTokens?: number;
    jsonMode?: boolean;
    responseSchema?: unknown;
    timeoutMs?: number;
  }
): Promise<string> {
  const keysPool = getApiKeyPool();

  if (!keysPool[0]) {
    throw new Error("GEMINI_API_KEY is not set in environment variables.");
  }

  const requestedModel: GeminiModel = options?.model ?? "gemini-3.5-flash-lite";
  const primaryModel = MODEL_ENDPOINTS[requestedModel] || "gemini-3.5-flash-lite";
  const modelsToTry = [primaryModel, "gemini-2.5-flash", "gemini-2.0-flash"];

  const temperature = options?.temperature ?? 0.2;
  const maxTokens = options?.maxTokens ?? 2048;

  // Try across keys in the pool (up to total keys count)
  for (let attempt = 0; attempt < keysPool.length; attempt++) {
    const currentKey = keysPool[(keyIndex + attempt) % keysPool.length];
    const isAccessToken = currentKey.startsWith("ya29.");
    const authHeader: Record<string, string> = isAccessToken
      ? { Authorization: `Bearer ${currentKey}` }
      : {};
    const keyQuery = isAccessToken ? "" : `?key=${encodeURIComponent(currentKey)}`;

    for (const currentModel of modelsToTry) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${currentModel}:generateContent${keyQuery}`;

        const payload: {
          contents: Array<{ role: string; parts: Array<{ text: string }> }>;
          generationConfig: {
            temperature: number;
            maxOutputTokens: number;
            responseMimeType?: string;
            responseSchema?: unknown;
          };
          systemInstruction?: { parts: Array<{ text: string }> };
        } = {
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
          console.warn(`[Gemini] Key #${(keyIndex + attempt) % keysPool.length + 1} / Model ${currentModel} returned HTTP ${res.status}: ${errText.substring(0, 150)}`);
          
          // On Rate Limit (429) or Not Found (404), advance key index and try next key
          if (res.status === 429 || res.status === 404) {
            keyIndex = (keyIndex + 1) % keysPool.length;
            break; // Break model loop to try next API key
          }
          continue;
        }

        const data = await res.json();
        const candidate = data.candidates?.[0];
        const text = candidate?.content?.parts?.[0]?.text;

        if (text === undefined || text === null || text === "") {
          const reason = candidate?.finishReason ?? "UNKNOWN";
          console.warn(`[Gemini] Model ${currentModel} returned empty content (finishReason: ${reason}).`);
          continue;
        }

        console.log(`[Gemini] ✓ Responded via Key #${(keyIndex + attempt) % keysPool.length + 1} (${currentModel})`);
        return text;
      } catch (error) {
        console.error(`[Gemini] Exception on model ${currentModel}:`, error instanceof Error ? error.message : error);
      }
    }
  }

  throw new Error("All Gemini API keys and models failed after retries.");
}

/**
 * Call Gemini and parse the response as JSON.
 * Strips any markdown code fences before parsing.
 */
export async function callGeminiJSON<T = unknown>(
  systemPrompt: string,
  userMessage: string,
  options?: {
    model?: GeminiModel;
    temperature?: number;
    maxTokens?: number;
    responseSchema?: unknown;
    timeoutMs?: number;
  }
): Promise<T> {
  const raw = await callGemini(systemPrompt, userMessage, {
    ...options,
    jsonMode: true
  });

  let cleaned = raw.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
  }

  try {
    return JSON.parse(cleaned) as T;
  } catch (err) {
    console.error("[Gemini] JSON Parse Error on raw response:", raw);
    throw err;
  }
}

/**
 * Batch semantic embeddings used only for unresolved skill/requirement pairs.
 */
export async function embedGeminiTexts(texts: string[]): Promise<number[][]> {
  const keysPool = getApiKeyPool();
  const apiKey = keysPool[keyIndex % keysPool.length] || keysPool[0];
  if (!apiKey) throw new Error('GEMINI_API_KEY is not set in environment variables.');
  if (texts.length === 0) return [];
  if (texts.length > 96) throw new Error('Too many texts for one embedding batch.');

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
  if (!embeddings || embeddings.length !== texts.length || embeddings.some((item) => item.length === 0)) {
    throw new Error('Gemini embedding response was incomplete.');
  }
  return embeddings;
}
