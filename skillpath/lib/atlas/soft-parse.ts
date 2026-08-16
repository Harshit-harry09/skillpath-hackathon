import { searchHnswSemanticSkills } from '@/lib/matching/hnsw-vector-matcher';

export interface AtlasSoftSignals {
  informalSkills: string[];
  gapTranslations: Array<{
    gapReason: string;
    translatedSkills: string[];
    narrative: string;
  }>;
  equitySignals: string[];
  transferableStrengths: string[];
  confidenceNarrative: string;
}

const INFORMAL_MAPPINGS: Array<{ signal: RegExp; source: string; skills: string[]; narrative: string }> = [
  {
    signal: /caregiv|elder care|family care|household/i,
    source: 'Caregiving or family care',
    skills: ['Crisis coordination', 'Schedule management', 'Resource budgeting', 'Documentation discipline'],
    narrative: 'Care responsibilities show operational judgment under constraints, not an absence of work.',
  },
  {
    signal: /freelance|independent client|self-employed/i,
    source: 'Freelance or independent work',
    skills: ['Client communication', 'Delivery ownership', 'Scope management'],
    narrative: 'Independent work demonstrates ownership across ambiguous briefs and real delivery deadlines.',
  },
  {
    signal: /volunteer|community|nonprofit/i,
    source: 'Volunteer or community work',
    skills: ['Stakeholder communication', 'Resource coordination', 'Service orientation'],
    narrative: 'Community work is evidence of initiative and coordination outside formal employment.',
  },
  {
    signal: /data entry|back office|records|excel/i,
    source: 'Data and back-office operations',
    skills: ['Data quality assurance', 'Process discipline', 'Accuracy under repetition'],
    narrative: 'Operational data work creates a credible bridge into quality, support, and analytics roles.',
  },
];

function unique(values: string[]): string[] {
  return Array.from(new Map(values.map((value) => [value.toLowerCase(), value])).values());
}

/**
 * Atlas-only interpretation layer. It deliberately avoids contact fields,
 * exact dates, YOE, ATS scoring, and keyword-gap calculations.
 */
export async function runAtlasSoftParse(resumeText = ''): Promise<AtlasSoftSignals> {
  const text = resumeText.slice(0, 12000);
  const informalSkills: string[] = [];
  const transferableStrengths: string[] = [];
  const gapTranslations: AtlasSoftSignals['gapTranslations'] = [];
  const equitySignals: string[] = [];

  for (const mapping of INFORMAL_MAPPINGS) {
    if (!mapping.signal.test(text)) continue;
    informalSkills.push(...mapping.skills);
    transferableStrengths.push(mapping.narrative);
    if (/caregiv|gap|break|sabbatical/i.test(text)) {
      gapTranslations.push({
        gapReason: mapping.source,
        translatedSkills: mapping.skills,
        narrative: mapping.narrative,
      });
    }
  }

  const lower = text.toLowerCase();
  if (/first[- ]generation|first[- ]gen|rural|tier[- ][23]/i.test(lower)) equitySignals.push('First-generation or location-aware support');
  if (/displac|automation|laid off|redundant/i.test(lower)) equitySignals.push('Displacement-aware transition support');
  if (/disab|pwd|wheelchair|accessib/i.test(lower)) equitySignals.push('Accessibility-aware opportunity matching');
  if (/caregiv|returner|career break|sabbatical/i.test(lower)) equitySignals.push('Career re-entry protection');

  // Vector lookup is used only to enrich transferable powers; it never changes
  // the deterministic ATS facts owned by Results.
  for (const informalSkill of informalSkills.slice(0, 5)) {
    const matches = searchHnswSemanticSkills(informalSkill, 1);
    const semanticTitle = matches[0]?.title;
    if (semanticTitle && semanticTitle.toLowerCase() !== informalSkill.toLowerCase()) {
      transferableStrengths.push(`${informalSkill} maps near ${semanticTitle}`);
    }
  }

  const finalSkills = unique(informalSkills);
  const finalStrengths = unique(transferableStrengths);
  const finalSignals = unique(equitySignals);
  return {
    informalSkills: finalSkills,
    gapTranslations,
    equitySignals: finalSignals,
    transferableStrengths: finalStrengths,
    confidenceNarrative: finalSkills.length
      ? `Atlas found ${finalSkills.length} transferable powers in the broader story. Confirm the ones you want to use in your career narrative.`
      : 'Atlas needs more context about lived experience, side work, constraints, or goals before it can build a confident strategic narrative.',
  };
}

