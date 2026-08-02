/**
 * Unified Gemini API Client using standard REST fetches.
 * Highly robust, lightweight, handles errors, retries, and JSON parsing.
 */

export type GeminiModel =
  | "gemini-3.6-flash"
  | "gemini-3.5-flash"
  | "gemini-2.5-flash"
  | "gemini-2.0-flash"
  | "gemini-1.5-flash";

// Keep internal aliases mapped to verified endpoints. Do not probe a long list
// of speculative model names on every request.
const MODEL_ENDPOINTS: Record<string, string> = {
  "gemini-3.6-flash": "gemini-2.5-flash",
  "gemini-3.5-flash": "gemini-2.5-flash",
  "gemini-2.5-flash": "gemini-2.5-flash",
  "gemini-2.0-flash": "gemini-2.0-flash",
  "gemini-1.5-flash": "gemini-2.0-flash",
};

/**
 * Send a prompt to Gemini and return the text response.
 * Auto-falls back across valid endpoints on rate limit or error.
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
  const rawApiKey = process.env.GEMINI_API_KEY || "";
  const apiKey = rawApiKey.trim().replace(/^["']|["']$/g, '');

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set in environment variables.");
  }

  const isAccessToken = apiKey.startsWith("ya29.");
  const authHeader: Record<string, string> = isAccessToken
    ? { Authorization: `Bearer ${apiKey}` }
    : {};
  const keyQuery = isAccessToken ? "" : `?key=${encodeURIComponent(apiKey)}`;

  const requestedModel: GeminiModel = options?.model ?? "gemini-2.5-flash";
  const temperature = options?.temperature ?? 0.2;
  const maxTokens = options?.maxTokens ?? 2048;

  // Bounded provider budget: one primary request and at most one configured
  // fallback. This prevents cascading retries from blowing route budgets.
  const modelsToTry = Array.from(new Set([
    MODEL_ENDPOINTS[requestedModel] || "gemini-2.5-flash",
    process.env.GEMINI_FALLBACK_MODEL || "",
  ].filter(Boolean))).slice(0, 2);

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
        signal: AbortSignal.timeout(options?.timeoutMs ?? 8000),
      });

      if (!res.ok) {
        const errText = await res.text();
        console.warn(`[Gemini] Error on model ${currentModel} (HTTP ${res.status}): ${errText.substring(0, 200)}`);
        continue;
      }

      const data = await res.json();
      const candidate = data.candidates?.[0];
      const text = candidate?.content?.parts?.[0]?.text;

      if (text === undefined || text === null || text === "") {
        const reason = candidate?.finishReason ?? "UNKNOWN";
        console.warn(`[Gemini] Model ${currentModel} returned empty content (finishReason: ${reason}). Trying next model.`);
        continue;
      }

      console.log(`[Gemini] ✓ Responded via ${currentModel}`);
      return text;
    } catch (error) {
      console.error(`[Gemini] Exception on model ${currentModel}:`, error instanceof Error ? error.message : error);
    }
  }

  throw new Error("All Gemini models failed after retries.");
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
 * Embeddings are never persisted; the caller keeps them in request memory.
 */
export async function embedGeminiTexts(texts: string[]): Promise<number[][]> {
  const rawApiKey = process.env.GEMINI_API_KEY || "";
  const apiKey = rawApiKey.trim().replace(/^["']|["']$/g, '');
  if (!apiKey) throw new Error('GEMINI_API_KEY is not set in environment variables.');
  if (texts.length === 0) return [];
  if (texts.length > 96) throw new Error('Too many texts for one embedding batch.');

  const model = process.env.GEMINI_EMBEDDING_MODEL || 'gemini-embedding-001';
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
