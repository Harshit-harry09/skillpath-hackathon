export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens?: number;
}

export interface UsageMetric {
  route: string;
  model: string;
  userId?: string;
  usage: TokenUsage;
  estimatedCostUsd: number;
  timestamp: number;
  cacheHit?: boolean;
}

// Approximate Gemini pricing per 1M tokens (USD)
const MODEL_PRICING: Record<string, { prompt: number; completion: number }> = {
  "gemini-2.0-flash": { prompt: 0.10, completion: 0.40 },
  "gemini-2.5-flash": { prompt: 0.10, completion: 0.40 },
  "gemini-3.6-flash": { prompt: 0.10, completion: 0.40 },
  "gemini-1.5-pro": { prompt: 1.25, completion: 5.00 },
  "flash-lite": { prompt: 0.05, completion: 0.15 },
};

export function estimateCost(model: string, usage: TokenUsage): number {
  const rates = MODEL_PRICING[model] || MODEL_PRICING["gemini-2.0-flash"];
  const promptCost = (usage.promptTokens / 1_000_000) * rates.prompt;
  const completionCost = (usage.completionTokens / 1_000_000) * rates.completion;
  return Number((promptCost + completionCost).toFixed(6));
}

export function logUsage(metric: Omit<UsageMetric, "timestamp" | "estimatedCostUsd"> & { estimatedCostUsd?: number }): UsageMetric {
  const cost = metric.estimatedCostUsd ?? estimateCost(metric.model, metric.usage);
  const fullMetric: UsageMetric = {
    ...metric,
    estimatedCostUsd: cost,
    timestamp: Date.now(),
  };

  if (process.env.NODE_ENV !== "production" || process.env.DEBUG_AI === "true") {
    console.log(
      `[AI Metrics] Route: ${fullMetric.route} | Model: ${fullMetric.model} | ` +
      `Tokens: P:${fullMetric.usage.promptTokens}/C:${fullMetric.usage.completionTokens} | ` +
      `Cost: $${fullMetric.estimatedCostUsd} | CacheHit: ${!!fullMetric.cacheHit}`
    );
  }

  // Langfuse LLM Observability event dispatch
  if (process.env.LANGFUSE_PUBLIC_KEY && process.env.LANGFUSE_SECRET_KEY) {
    try {
      const host = process.env.LANGFUSE_HOST || 'https://cloud.langfuse.com';
      fetch(`${host}/api/public/ingestion`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Basic ' + Buffer.from(`${process.env.LANGFUSE_PUBLIC_KEY}:${process.env.LANGFUSE_SECRET_KEY}`).toString('base64'),
        },
        body: JSON.stringify({
          batch: [
            {
              type: 'trace-create',
              id: `trace-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
              timestamp: new Date().toISOString(),
              body: {
                name: fullMetric.route,
                userId: fullMetric.userId || 'anonymous',
                metadata: { model: fullMetric.model, costUsd: fullMetric.estimatedCostUsd, cacheHit: fullMetric.cacheHit },
              },
            },
          ],
        }),
      }).catch(() => null);
    } catch {
      // Non-blocking observability
    }
  }

  return fullMetric;
}
