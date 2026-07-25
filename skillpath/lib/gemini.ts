/**
 * Unified Gemini API Client using standard REST fetches.
 * Highly robust, lightweight, handles errors, retries, and JSON parsing.
 */

export type GeminiModel =
  | "gemini-3.6-flash"
  | "gemini-3.5-flash"
  | "gemini-2.0-flash"
  | "gemini-1.5-flash";

// Map custom user/internal aliases to active Google Gemini REST API endpoints
const MODEL_ENDPOINTS: Record<string, string> = {
  "gemini-3.6-flash": "gemini-2.0-flash",
  "gemini-3.5-flash": "gemini-2.0-flash",
  "gemini-2.0-flash": "gemini-2.0-flash",
  "gemini-1.5-flash": "gemini-1.5-flash",
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
  }
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set in environment variables.");
  }

  const isAccessToken = apiKey.startsWith("AQ.");
  const authHeader: Record<string, string> = isAccessToken
    ? { Authorization: `Bearer ${apiKey}` }
    : {};
  const keyQuery = isAccessToken ? "" : `?key=${apiKey}`;

  const requestedModel: GeminiModel = options?.model ?? "gemini-2.0-flash";
  const temperature = options?.temperature ?? 0.2;
  const maxTokens = options?.maxTokens ?? 2048;

  // Fallback models in priority order
  const rawModelsToTry: string[] = [
    MODEL_ENDPOINTS[requestedModel] || "gemini-2.0-flash",
    "gemini-2.0-flash",
    "gemini-1.5-flash",
  ];

  // Deduplicate fallback list
  const modelsToTry = Array.from(new Set(rawModelsToTry));

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
      }

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeader },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(12000),
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
