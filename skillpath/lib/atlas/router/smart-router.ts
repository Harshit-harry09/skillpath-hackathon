/**
 * ATLAS 2.0 SMART LLM ROUTER
 * Routes tasks dynamically across 5 execution tiers for speed and cost efficiency.
 */

import { callGemini, callGeminiJSON, GeminiModel } from '@/lib/gemini';
import { getSemanticCachedOutput, setSemanticCachedOutput } from './semantic-cache';

export type RouterTier = 'cache' | 'deterministic' | 'flash' | 'pro' | 'fallback';

export interface RouteTaskOptions {
  taskDescription: string;
  systemPrompt: string;
  userMessage: string;
  tierRequirement?: RouterTier;
  jsonMode?: boolean;
  deterministicFn?: () => unknown;
}

export interface RouteTaskResult<T = unknown> {
  result: T;
  tierUsed: RouterTier;
  cached: boolean;
  durationMs: number;
}

/**
 * Main Smart Router dispatch function.
 */
export async function routeTask<T = unknown>(options: RouteTaskOptions): Promise<RouteTaskResult<T>> {
  const startTime = Date.now();

  // Tier 1: Semantic Cache Check
  if (options.tierRequirement !== 'deterministic') {
    const cacheResult = await getSemanticCachedOutput<T>(options.userMessage);
    if (cacheResult.hit && cacheResult.data) {
      return {
        result: cacheResult.data,
        tierUsed: 'cache',
        cached: true,
        durationMs: Date.now() - startTime,
      };
    }
  }

  // Tier 2: Deterministic Engine
  if (options.deterministicFn) {
    try {
      const detResult = options.deterministicFn() as T;
      if (detResult !== undefined && detResult !== null) {
        return {
          result: detResult,
          tierUsed: 'deterministic',
          cached: false,
          durationMs: Date.now() - startTime,
        };
      }
    } catch (err) {
      console.warn('[SmartRouter] Deterministic engine failed, falling through to LLM:', err);
    }
  }

  // Tier 3 & 4: Gemini Flash / Gemini Pro
  const targetModel: GeminiModel = options.tierRequirement === 'pro' ? 'gemini-3.5-flash' : 'gemini-3.5-flash-lite';

  try {
    let llmResult: T;
    if (options.jsonMode) {
      llmResult = await callGeminiJSON<T>(options.systemPrompt, options.userMessage, {
        model: targetModel,
      });
    } else {
      const rawText = await callGemini(options.systemPrompt, options.userMessage, {
        model: targetModel,
      });
      llmResult = rawText as unknown as T;
    }

    // Cache the result for future calls
    await setSemanticCachedOutput(options.userMessage, llmResult);

    return {
      result: llmResult,
      tierUsed: options.tierRequirement === 'pro' ? 'pro' : 'flash',
      cached: false,
      durationMs: Date.now() - startTime,
    };
  } catch (err) {
    console.error('[SmartRouter] Primary LLM call failed, engaging Tier 5 fallback:', err);
    throw err;
  }
}
