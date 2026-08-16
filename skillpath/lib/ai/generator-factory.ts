import { GENERATOR_REGISTRY, GeneratorToolId } from "./generator-registry";
import { generateCacheKey, getCachedResult, setCachedResult } from "@/lib/cache/exact-cache";
import { callGeminiJSON } from "@/lib/gemini";
import { logUsage } from "@/lib/observability/cost-tracker";

export interface GeneratorResult<T = any> {
  data: T;
  fallback: boolean;
  source: "cache" | "gemini" | "fallback_template";
  usage?: {
    promptTokens: number;
    completionTokens: number;
  };
}

export async function runGeneratorTool<T = any>(
  toolId: GeneratorToolId,
  rawInput: unknown
): Promise<GeneratorResult<T>> {
  const config = GENERATOR_REGISTRY[toolId];
  if (!config) {
    throw new Error(`Unknown generator tool: ${toolId}`);
  }

  const parsedInput = config.inputSchema.parse(rawInput);
  const cacheKey = generateCacheKey(`gen:${toolId}`, parsedInput);

  const cached = getCachedResult<T>(cacheKey);
  if (cached) {
    logUsage({
      route: `/api/generate/${toolId}`,
      model: config.model,
      usage: { promptTokens: 0, completionTokens: 0 },
      estimatedCostUsd: 0,
      cacheHit: true,
    });
    return {
      data: cached,
      fallback: false,
      source: "cache",
    };
  }

  try {
    const prompt = config.buildPrompt(parsedInput);
    const rawResult = await callGeminiJSON<any>(config.systemPrompt, prompt, {
      model: config.model,
      temperature: config.temperature,
      maxTokens: config.maxTokens,
    });

    let validatedData: T;
    if (config.id === "cover-lines" && Array.isArray(rawResult)) {
      validatedData = { lines: rawResult.slice(0, 3) } as unknown as T;
    } else if (config.id === "linkedin-headlines" && Array.isArray(rawResult)) {
      validatedData = { headlines: rawResult.slice(0, 3) } as unknown as T;
    } else if (config.id === "star-bullets" && Array.isArray(rawResult)) {
      validatedData = { bullets: rawResult.slice(0, 3) } as unknown as T;
    } else {
      validatedData = config.outputSchema.parse(rawResult);
    }

    setCachedResult(cacheKey, validatedData);

    logUsage({
      route: `/api/generate/${toolId}`,
      model: config.model,
      usage: { promptTokens: 150, completionTokens: 150 },
      cacheHit: false,
    });

    return {
      data: validatedData,
      fallback: false,
      source: "gemini",
    };
  } catch (error) {
    console.error(`[GeneratorFactory Error] tool=${toolId}:`, error);
    const fallbackData = config.getFallback(parsedInput);
    return {
      data: fallbackData,
      fallback: true,
      source: "fallback_template",
    };
  }
}
