import type { AnalysisEvidence, AnalysisRequirement } from '@/types/analysis';

export interface AiRoleExtraction {
  canonical: string;
  confidence: number;
  alternatives: string[];
}

export interface AiAnalysisExtraction {
  role: AiRoleExtraction;
  resume_evidence: AnalysisEvidence[];
  job_requirements: AnalysisRequirement[];
}

const MAX_EVIDENCE = 80;
const MAX_REQUIREMENTS = 80;
const MAX_QUOTE_LENGTH = 500;
const MAX_SKILL_LENGTH = 120;

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value.trim() : fallback;
}

function clampConfidence(value: unknown): number {
  const number = typeof value === 'number' && Number.isFinite(value) ? value : 0.5;
  return Math.max(0, Math.min(1, number));
}

function optionalNumber(value: unknown, min: number, max: number): number | undefined {
  if (typeof value !== 'number' || !Number.isFinite(value)) return undefined;
  return Math.max(min, Math.min(max, value));
}

function normalizeId(value: unknown, fallback: string): string {
  const id = asString(value, fallback).replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 80);
  return id || fallback;
}

function normalizeQuote(value: unknown): string {
  return asString(value).replace(/\s+/g, ' ').slice(0, MAX_QUOTE_LENGTH);
}

function normalizeSkill(value: unknown): string {
  return asString(value).replace(/\s+/g, ' ').slice(0, MAX_SKILL_LENGTH);
}

function normalizeEvidence(value: unknown, index: number): AnalysisEvidence | null {
  if (!value || typeof value !== 'object') return null;
  const item = value as Record<string, unknown>;
  const skill = normalizeSkill(item.skill);
  const canonicalSkill = normalizeSkill(item.canonical_skill || skill);
  const quote = normalizeQuote(item.quote);
  if (!skill || !canonicalSkill || !quote) return null;

  const strength = ['strong', 'moderate', 'weak', 'unclear'].includes(String(item.strength))
    ? item.strength as AnalysisEvidence['strength']
    : 'unclear';

  return {
    id: normalizeId(item.id, `resume_${index + 1}`),
    source: 'resume',
    skill,
    canonical_skill: canonicalSkill,
    quote,
    section: asString(item.section).slice(0, 60) || undefined,
    years: optionalNumber(item.years, 0, 50),
    recency_year: optionalNumber(item.recency_year, 1950, new Date().getFullYear()),
    strength,
    confidence: clampConfidence(item.confidence),
  };
}

function normalizeRequirement(value: unknown, index: number): AnalysisRequirement | null {
  if (!value || typeof value !== 'object') return null;
  const item = value as Record<string, unknown>;
  const skill = normalizeSkill(item.skill);
  const canonicalSkill = normalizeSkill(item.canonical_skill || skill);
  const quote = normalizeQuote(item.quote);
  if (!skill || !canonicalSkill || !quote) return null;

  const importance = ['must_have', 'should_have', 'nice_to_have'].includes(String(item.importance))
    ? item.importance as AnalysisRequirement['importance']
    : 'should_have';

  return {
    id: normalizeId(item.id, `jd_${index + 1}`),
    skill,
    canonical_skill: canonicalSkill,
    importance,
    quote,
    minimum_years: optionalNumber(item.minimum_years, 0, 50),
    confidence: clampConfidence(item.confidence),
  };
}

function dedupeIds<T extends { id: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

/**
 * Runtime validation for model output. JSON mode guarantees syntax, not
 * trustworthy values, so every field is bounded and normalized here.
 */
export function validateAiAnalysisExtraction(value: unknown): AiAnalysisExtraction {
  if (!value || typeof value !== 'object') throw new Error('AI output must be an object.');
  const raw = value as Record<string, unknown>;
  const rawRole = raw.role && typeof raw.role === 'object' ? raw.role as Record<string, unknown> : {};
  const role = asString(rawRole.canonical).slice(0, MAX_SKILL_LENGTH);
  if (!role) throw new Error('AI output is missing a canonical role.');

  const resumeEvidence = dedupeIds(
    (Array.isArray(raw.resume_evidence) ? raw.resume_evidence : [])
      .slice(0, MAX_EVIDENCE)
      .map(normalizeEvidence)
      .filter((item): item is AnalysisEvidence => Boolean(item))
  );
  const jobRequirements = dedupeIds(
    (Array.isArray(raw.job_requirements) ? raw.job_requirements : [])
      .slice(0, MAX_REQUIREMENTS)
      .map(normalizeRequirement)
      .filter((item): item is AnalysisRequirement => Boolean(item))
  );

  if (jobRequirements.length === 0) throw new Error('AI output contains no usable job requirements.');

  return {
    role: {
      canonical: role,
      confidence: clampConfidence(rawRole.confidence),
      alternatives: Array.isArray(rawRole.alternatives)
        ? rawRole.alternatives.map((item) => asString(item).slice(0, MAX_SKILL_LENGTH)).filter(Boolean).slice(0, 5)
        : [],
    },
    resume_evidence: resumeEvidence,
    job_requirements: jobRequirements,
  };
}

export function quoteAppearsInText(quote: string, sourceText: string): boolean {
  const normalize = (value: string) => value
    .toLowerCase()
    .replace(/[^a-z0-9+#.]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const normalizedQuote = normalize(quote);
  const normalizedSource = normalize(sourceText);
  return Boolean(normalizedQuote) && normalizedSource.includes(normalizedQuote);
}

export function filterEvidenceToSource(
  extraction: AiAnalysisExtraction,
  resumeText: string,
  jdText: string
): AiAnalysisExtraction {
  const resumeEvidence = extraction.resume_evidence.filter((item) => quoteAppearsInText(item.quote, resumeText));
  const jobRequirements = extraction.job_requirements.filter((item) => quoteAppearsInText(item.quote, jdText));
  if (jobRequirements.length === 0) throw new Error('AI requirements did not contain verifiable source quotes.');
  return { ...extraction, resume_evidence: resumeEvidence, job_requirements: jobRequirements };
}

export const AI_ANALYSIS_RESPONSE_SCHEMA = {
  type: 'OBJECT',
  properties: {
    role: {
      type: 'OBJECT',
      properties: {
        canonical: { type: 'STRING' },
        confidence: { type: 'NUMBER' },
        alternatives: { type: 'ARRAY', items: { type: 'STRING' } },
      },
      required: ['canonical', 'confidence', 'alternatives'],
    },
    resume_evidence: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          id: { type: 'STRING' },
          skill: { type: 'STRING' },
          canonical_skill: { type: 'STRING' },
          quote: { type: 'STRING' },
          section: { type: 'STRING' },
          years: { type: 'NUMBER' },
          recency_year: { type: 'INTEGER' },
          strength: { type: 'STRING', enum: ['strong', 'moderate', 'weak', 'unclear'] },
          confidence: { type: 'NUMBER' },
        },
        required: ['id', 'skill', 'canonical_skill', 'quote', 'confidence'],
      },
    },
    job_requirements: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          id: { type: 'STRING' },
          skill: { type: 'STRING' },
          canonical_skill: { type: 'STRING' },
          importance: { type: 'STRING', enum: ['must_have', 'should_have', 'nice_to_have'] },
          quote: { type: 'STRING' },
          minimum_years: { type: 'NUMBER' },
          confidence: { type: 'NUMBER' },
        },
        required: ['id', 'skill', 'canonical_skill', 'importance', 'quote', 'confidence'],
      },
    },
  },
  required: ['role', 'resume_evidence', 'job_requirements'],
} as const;
