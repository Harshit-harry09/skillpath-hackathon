import { z } from 'zod';

export const DEFAULT_ATLAS_GOAL = 'Explore my next career move';

function emptyOrNullToUndefined(value: unknown): unknown {
  return value === null || (typeof value === 'string' && !value.trim()) ? undefined : value;
}

const optionalText = z.preprocess(emptyOrNullToUndefined, z.string().trim().min(1).optional());

export const AtlasStartSchema = z.object({
  analysisId: optionalText,
  resumeText: optionalText,
  pdfBase64: optionalText,
  // The UI intentionally makes this field optional. Normalize a blank input
  // before applying the default so valid PDF/resume submissions do not 400.
  userGoal: z.preprocess(
    emptyOrNullToUndefined,
    z.string().trim().min(1).default(DEFAULT_ATLAS_GOAL),
  ),
  mode: z.enum(['direct', 'funnel']).default('direct'),
  confirmedAnswers: z.record(z.string(), z.string()).optional().default({}),
});

export type AtlasStartInput = z.infer<typeof AtlasStartSchema>;
