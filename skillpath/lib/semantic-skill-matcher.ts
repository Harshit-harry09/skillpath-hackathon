import { embedGeminiTexts } from '@/lib/gemini';
import type {
  AnalysisEvidence,
  AnalysisMatch,
  AnalysisRequirement,
  EvidenceMatchStatus,
  SkillGap,
} from '@/types/analysis';
import { TECH_ALIASES } from '@/lib/data/fuzzy-dictionary';

function normalize(value: string): string {
  const text = value.toLowerCase().replace(/[^a-z0-9+#.]+/g, ' ').replace(/\s+/g, ' ').trim();
  return TECH_ALIASES[text]?.toLowerCase() || text;
}

function tokens(value: string): Set<string> {
  return new Set(normalize(value).split(' ').filter((token) => token.length > 1));
}

function tokenOverlap(left: string, right: string): number {
  const a = tokens(left);
  const b = tokens(right);
  if (a.size === 0 || b.size === 0) return 0;
  let shared = 0;
  for (const token of a) if (b.has(token)) shared += 1;
  return shared / Math.max(a.size, b.size);
}

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  let magnitudeA = 0;
  let magnitudeB = 0;
  const size = Math.min(a.length, b.length);
  for (let i = 0; i < size; i += 1) {
    dot += a[i] * b[i];
    magnitudeA += a[i] * a[i];
    magnitudeB += b[i] * b[i];
  }
  if (magnitudeA === 0 || magnitudeB === 0) return 0;
  return dot / (Math.sqrt(magnitudeA) * Math.sqrt(magnitudeB));
}

function evidenceStatus(
  requirement: AnalysisRequirement,
  evidence: AnalysisEvidence,
  similarity: number,
  direct: boolean
): EvidenceMatchStatus {
  if (direct && requirement.minimum_years && evidence.years !== undefined && evidence.years < requirement.minimum_years) {
    return 'partially_matched';
  }
  if (direct || similarity >= 0.86) return 'matched';
  if (similarity >= 0.74) return 'partially_matched';
  if (similarity >= 0.64) return 'transferable';
  return 'missing';
}

function matchReason(status: EvidenceMatchStatus, requirement: AnalysisRequirement, evidence?: AnalysisEvidence): string {
  if (status === 'matched') return evidence ? `Supported by resume evidence: “${evidence.quote}”` : 'Strong evidence match.';
  if (status === 'partially_matched') return evidence
    ? `Related evidence exists, but the requirement is not fully proven: “${evidence.quote}”`
    : 'Related evidence exists but does not fully prove the requirement.';
  if (status === 'transferable') return evidence
    ? `Transferable evidence may apply: “${evidence.quote}”`
    : 'A nearby skill may transfer, but this requires confirmation.';
  if (status === 'unclear') return `Evidence for ${requirement.canonical_skill} is ambiguous.`;
  return `Required by the job description, but no supporting resume evidence was found.`;
}

/**
 * Match exact/alias/token candidates locally first. Only unresolved
 * requirements use one bounded embedding batch; if embeddings fail, the
 * deterministic local result remains valid.
 */
export async function matchRequirements(
  requirements: AnalysisRequirement[],
  evidence: AnalysisEvidence[]
): Promise<AnalysisMatch[]> {
  const matches: AnalysisMatch[] = [];
  const unresolved: Array<{ requirement: AnalysisRequirement; candidates: AnalysisEvidence[] }> = [];

  for (const requirement of requirements) {
    const requirementSkill = normalize(requirement.canonical_skill);
    const directCandidates = evidence.filter((item) => {
      const evidenceSkill = normalize(item.canonical_skill);
      return evidenceSkill === requirementSkill ||
        evidenceSkill.includes(requirementSkill) ||
        requirementSkill.includes(evidenceSkill);
    });

    if (directCandidates.length > 0) {
      const best = directCandidates.sort((a, b) => b.confidence - a.confidence)[0];
      const status = evidenceStatus(requirement, best, 1, true);
      matches.push({
        requirement_id: requirement.id,
        status,
        evidence_ids: [best.id],
        similarity: 1,
        reason: matchReason(status, requirement, best),
        confidence: Math.min(requirement.confidence, best.confidence),
      });
      continue;
    }

    const tokenCandidates = evidence
      .map((item) => ({ item, overlap: tokenOverlap(requirement.canonical_skill, item.canonical_skill) }))
      .filter(({ overlap }) => overlap >= 0.5)
      .sort((a, b) => b.overlap - a.overlap);

    if (tokenCandidates.length > 0) {
      const best = tokenCandidates[0];
      const status = evidenceStatus(requirement, best.item, best.overlap, false);
      matches.push({
        requirement_id: requirement.id,
        status,
        evidence_ids: [best.item.id],
        similarity: Number(best.overlap.toFixed(3)),
        reason: matchReason(status, requirement, best.item),
        confidence: Math.min(requirement.confidence, best.item.confidence),
      });
      continue;
    }

    unresolved.push({ requirement, candidates: evidence });
  }

  if (unresolved.length === 0 || evidence.length === 0) {
    return [...matches, ...requirements
      .filter((requirement) => !matches.some((match) => match.requirement_id === requirement.id))
      .map((requirement) => ({
        requirement_id: requirement.id,
        status: 'missing' as const,
        evidence_ids: [],
        similarity: 0,
        reason: matchReason('missing', requirement),
        confidence: requirement.confidence,
      }))];
  }

  try {
    const queryTexts = unresolved.map(({ requirement }) => `${requirement.canonical_skill}. ${requirement.quote}`);
    const evidenceTexts = evidence.map((item) => `${item.canonical_skill}. ${item.quote}`);
    const vectors = await embedGeminiTexts([...queryTexts, ...evidenceTexts]);
    const evidenceVectors = vectors.slice(queryTexts.length);

    for (let index = 0; index < unresolved.length; index += 1) {
      const { requirement } = unresolved[index];
      let bestIndex = -1;
      let bestSimilarity = 0;
      for (let evidenceIndex = 0; evidenceIndex < evidence.length; evidenceIndex += 1) {
        const similarity = cosineSimilarity(vectors[index], evidenceVectors[evidenceIndex]);
        if (similarity > bestSimilarity) {
          bestSimilarity = similarity;
          bestIndex = evidenceIndex;
        }
      }
      const best = bestIndex >= 0 ? evidence[bestIndex] : undefined;
      const status = best && bestSimilarity >= 0.64
        ? evidenceStatus(requirement, best, bestSimilarity, false)
        : 'missing';
      matches.push({
        requirement_id: requirement.id,
        status,
        evidence_ids: best && status !== 'missing' ? [best.id] : [],
        similarity: Number(bestSimilarity.toFixed(3)),
        reason: matchReason(status, requirement, best),
        confidence: best ? Math.min(requirement.confidence, best.confidence) : requirement.confidence,
      });
    }
  } catch {
    for (const { requirement } of unresolved) {
      matches.push({
        requirement_id: requirement.id,
        status: 'missing',
        evidence_ids: [],
        similarity: 0,
        reason: matchReason('missing', requirement),
        confidence: requirement.confidence,
      });
    }
  }

  return matches;
}

function importanceWeight(importance: AnalysisRequirement['importance']): number {
  return importance === 'must_have' ? 3 : importance === 'should_have' ? 2 : 1;
}

function coverageValue(status: EvidenceMatchStatus): number {
  switch (status) {
    case 'matched': return 1;
    case 'partially_matched': return 0.6;
    case 'transferable': return 0.45;
    case 'unclear': return 0.25;
    default: return 0;
  }
}

export function scoreEvidenceCoverage(
  requirements: AnalysisRequirement[],
  matches: AnalysisMatch[]
): number {
  if (requirements.length === 0) return 0;
  const byId = new Map(matches.map((match) => [match.requirement_id, match]));
  let weightedCoverage = 0;
  let totalWeight = 0;
  for (const requirement of requirements) {
    const weight = importanceWeight(requirement.importance);
    totalWeight += weight;
    weightedCoverage += weight * coverageValue(byId.get(requirement.id)?.status || 'missing');
  }
  return totalWeight === 0 ? 0 : Math.round((weightedCoverage / totalWeight) * 100);
}

export function buildEnrichedGaps(
  localGaps: SkillGap[],
  requirements: AnalysisRequirement[],
  matches: AnalysisMatch[],
  evidence: AnalysisEvidence[],
  mvcSkills: string[]
): SkillGap[] {
  const evidenceById = new Map(evidence.map((item) => [item.id, item]));
  const localBySkill = new Map(localGaps.map((gap) => [normalize(gap.skill), gap]));
  const requirementById = new Map(requirements.map((requirement) => [requirement.id, requirement]));
  const gaps: SkillGap[] = [];

  for (const match of matches) {
    if (match.status === 'matched') continue;
    const requirement = requirementById.get(match.requirement_id);
    if (!requirement) continue;
    const localGap = localBySkill.get(normalize(requirement.canonical_skill));
    const sourceEvidence = match.evidence_ids.map((id) => evidenceById.get(id)).filter(Boolean) as AnalysisEvidence[];
    const baseWeeks = localGap?.weeks_to_learn || (match.status === 'missing' ? 3 : 2);
    gaps.push({
      ...(localGap || {}),
      skill: requirement.canonical_skill,
      priority: 0,
      weeks_to_learn: Math.max(1, baseWeeks),
      reason: match.reason,
      in_mvc: localGap?.in_mvc || mvcSkills.some((skill) => normalize(skill) === normalize(requirement.canonical_skill)),
      match_status: match.status,
      importance: requirement.importance,
      requirement_id: requirement.id,
      evidence_ids: match.evidence_ids,
      evidence_quotes: sourceEvidence.map((item) => item.quote),
      evidence_details: sourceEvidence.map((item) => ({
        quote: item.quote,
        section: item.section,
        years: item.years,
        recency_year: item.recency_year,
        strength: item.strength,
      })),
      confidence: match.confidence,
    });
  }

  const coveredSkills = new Set(gaps.map((gap) => normalize(gap.skill)));
  for (const localGap of localGaps) {
    if (!coveredSkills.has(normalize(localGap.skill))) {
      gaps.push({
        ...localGap,
        match_status: 'unclear',
        reason: 'Local taxonomy flagged this gap, but the AI evidence pass could not verify the requirement.',
        confidence: 0.4,
      });
    }
  }

  return gaps
    .sort((a, b) => {
      const aStatus = a.match_status === 'missing' ? 0 : a.match_status === 'partially_matched' ? 1 : 2;
      const bStatus = b.match_status === 'missing' ? 0 : b.match_status === 'partially_matched' ? 1 : 2;
      return Number(b.in_mvc) - Number(a.in_mvc) || aStatus - bStatus || a.weeks_to_learn - b.weeks_to_learn;
    })
    .slice(0, 30)
    .map((gap, index) => ({ ...gap, priority: index + 1 }));
}
