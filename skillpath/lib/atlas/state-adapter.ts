import type { AtlasSessionState } from './orchestrator';

export function adaptAtlasState(raw: unknown): AtlasSessionState {
  const value = (raw && typeof raw === 'object' ? raw : {}) as Partial<AtlasSessionState> & { schema_version?: number };
  if (value.schema_version === 2) return value as AtlasSessionState;
  return {
    ...value,
    schema_version: 2,
    source: value.source ?? { mode: 'direct' },
    softSignals: value.softSignals ?? {
      informalSkills: [],
      gapTranslations: [],
      equitySignals: [],
      transferableStrengths: [],
      confidenceNarrative: 'No strategic context has been confirmed yet.',
    },
  } as AtlasSessionState;
}

