/**
 * ATLAS AGENT 1 — Resume Parser Agent
 *
 * Brain: Gemini parses raw resume text and returns structured JSON
 * with skills, experience, education, gaps, confidence scores, and
 * candidate profile signals.
 *
 * Falls back to local regex extraction if Gemini is unavailable.
 */

import { callGeminiJSON, DEFAULT_GEMINI_MODEL } from '@/lib/gemini';
import { extractSkills } from '@/lib/mvc-profiler';

export interface WorkExperience {
  role: string;
  company: string;
  duration: string;
  durationMonths: number;
  skills: string[];
  isGap: boolean;
  gapReason?: string;
  confidence: number; // 0.0 - 1.0
}

export interface Education {
  degree: string;
  institution: string;
  year?: string;
  tier: 'elite' | 'state' | 'tier2_college' | 'unknown';
  confidence: number;
}

export interface ParsedResume {
  // Core Extraction
  skills: string[];
  inferredSkills: string[]; // Skills deduced from job descriptions / informal work
  location: string;
  locationTier: 'metro' | 'tier2' | 'tier3' | 'rural' | 'unknown';
  workExperience: WorkExperience[];
  education: Education[];
  totalExperienceMonths: number;
  certifications: string[];

  // Informal Credentials & Skills Discovery Extensions
  microCertifications: string[];
  informalCredentials: string[];
  projectWork: { title: string; description: string; skills: string[] }[];
  selfReportedCapabilities: string[];

  // Gap Detection
  detectedGapMonths: number;
  hasCareerGap: boolean;
  gapPeriods: { start: string; end: string; durationMonths: number }[];

  // Candidate Profile Signals
  hasCaregivingSignal: boolean;
  hasDataEntrySignal: boolean;
  hasDisplacedWorkerSignal: boolean;
  hasPwdSignal: boolean;
  hasWomenReturnerSignal: boolean;
  hasFirstGenSignal: boolean;

  // Confidence Metadata
  overallConfidence: number; // 0.0 - 1.0
  lowConfidenceFields: string[];
  rawText: string;
}

const SYSTEM_PROMPT = `You are the Atlas Resume Parser Agent — an elite NLP system trained on millions of resumes and job profiles.

Your job is to parse raw resume text and return a detailed structured JSON profile of the candidate.

You must:
1. Extract ALL technical and soft skills mentioned (including implied skills from job descriptions).
2. Infer additional skills from informal work (e.g., caregiving → scheduling, coordination, documentation, stakeholder management).
3. Detect career gaps from timeline inconsistencies or explicit mentions.
4. Identify location and classify it as metro/tier2/tier3/rural.
5. Classify education institution tier.
6. Estimate total work experience in months.
7. Detect signals: caregiving break, data entry background, displaced worker, PWD, women returner, first-generation graduate.
8. Assign confidence scores (0.0-1.0) to each field.
9. Flag fields where you are uncertain.

CRITICAL RULES:
- Do NOT penalize career gaps. Treat them as data points, not negatives.
- Infer skills generously from ALL experience including non-tech (caregiving, household management, retail, etc.).
- If resume is sparse, still extract what you can and flag low-confidence fields.

Return ONLY valid JSON. No explanation.`;

const FALLBACK_LOCATIONS: Record<string, { city: string; tier: ParsedResume['locationTier'] }> = {
  bengaluru: { city: 'Bengaluru, KA', tier: 'metro' },
  bangalore: { city: 'Bengaluru, KA', tier: 'metro' },
  mumbai: { city: 'Mumbai, MH', tier: 'metro' },
  delhi: { city: 'NCR, Delhi', tier: 'metro' },
  noida: { city: 'Noida, UP', tier: 'metro' },
  gurgaon: { city: 'Gurugram, HR', tier: 'metro' },
  hyderabad: { city: 'Hyderabad, TS', tier: 'metro' },
  pune: { city: 'Pune, MH', tier: 'metro' },
  chennai: { city: 'Chennai, TN', tier: 'metro' },
  jaipur: { city: 'Jaipur, RJ', tier: 'tier2' },
  lucknow: { city: 'Lucknow, UP', tier: 'tier2' },
  indore: { city: 'Indore, MP', tier: 'tier2' },
  bhopal: { city: 'Bhopal, MP', tier: 'tier2' },
  nagpur: { city: 'Nagpur, MH', tier: 'tier2' },
  vadodara: { city: 'Vadodara, GJ', tier: 'tier2' },
  surat: { city: 'Surat, GJ', tier: 'tier2' },
  patna: { city: 'Patna, BR', tier: 'tier3' },
};

function localFallbackParse(rawText: string): ParsedResume {
  const lower = rawText.toLowerCase();
  const skills = extractSkills(rawText);

  let location = 'India (Tier Unknown)';
  let locationTier: ParsedResume['locationTier'] = 'unknown';
  for (const [key, val] of Object.entries(FALLBACK_LOCATIONS)) {
    if (lower.includes(key)) { location = val.city; locationTier = val.tier; break; }
  }

  const hasGap = lower.includes('gap') || lower.includes('career break') || lower.includes('caregiving') || lower.includes('sabbatical');
  const hasCaregiving = lower.includes('care') || lower.includes('family') || lower.includes('mother') || lower.includes('elder') || lower.includes('child');
  const hasDataEntry = lower.includes('data entry') || lower.includes('back office') || lower.includes('typing') || lower.includes('excel');
  const hasDisplaced = lower.includes('layoff') || lower.includes('automation') || lower.includes('redundant') || lower.includes('closed') || lower.includes('laid off');
  const hasPwd = lower.includes('disability') || lower.includes('pwd') || lower.includes('wheelchair');
  const hasFirstGen = lower.includes('first generation') || lower.includes('first-gen');

  return {
    skills,
    inferredSkills: hasCaregiving
      ? ['Stakeholder Coordination', 'Schedule Management', 'Resource Budgeting', 'Documentation', 'Crisis Management']
      : hasDataEntry
      ? ['Data Quality Assurance', 'Process Discipline', 'Attention to Detail', 'Record Keeping']
      : [],
    location,
    locationTier,
    workExperience: [],
    education: [],
    totalExperienceMonths: 0,
    certifications: [],
    microCertifications: hasCaregiving ? ['Elder Care Operations', 'Household Resource Administration'] : [],
    informalCredentials: hasCaregiving ? ['Family Logistics Coordinator', 'Home Healthcare Manager'] : [],
    projectWork: [],
    selfReportedCapabilities: skills.slice(0, 5),
    detectedGapMonths: hasGap ? 36 : 0,
    hasCareerGap: hasGap,
    gapPeriods: [],
    hasCaregivingSignal: hasCaregiving,
    hasDataEntrySignal: hasDataEntry,
    hasDisplacedWorkerSignal: hasDisplaced,
    hasPwdSignal: hasPwd,
    hasWomenReturnerSignal: hasCaregiving,
    hasFirstGenSignal: hasFirstGen,
    overallConfidence: 0.55,
    lowConfidenceFields: ['workExperience', 'education', 'gapPeriods', 'totalExperienceMonths'],
    rawText,
  };
}

function ensureStringArray(input: unknown): string[] {
  if (Array.isArray(input)) {
    return input.map(item => {
      if (typeof item === 'string') return item;
      if (item && typeof item === 'object') {
        return (item as any).name || (item as any).skill || (item as any).title || JSON.stringify(item);
      }
      return String(item);
    }).filter(s => typeof s === 'string' && s.trim().length > 0);
  }
  if (typeof input === 'string') {
    return input.split(/[,;\n]/).map(s => s.trim()).filter(Boolean);
  }
  if (input && typeof input === 'object') {
    const strings: string[] = [];
    for (const val of Object.values(input)) {
      strings.push(...ensureStringArray(val));
    }
    return strings;
  }
  return [];
}

export async function runResumeParserAgent(rawText: string, hardFacts?: any): Promise<ParsedResume> {
  const isSoftParseOnly = Boolean(hardFacts);

  const softPrompt = isSoftParseOnly ? `You are the Atlas Soft NLP Resume Parser Agent.
Hard Facts (exact skills, dates, contact info, YOE) have already been extracted deterministically.
YOUR SOLE PURPOSE IS TO EXTRACT CONTEXT & EQUITY SIGNALS:
1. Infer additional soft/operational skills from informal work (e.g. caregiving -> scheduling, coordination, budgeting).
2. Extract micro-certifications, informal credentials, and project work.
3. Detect equity signals: caregiving break, data entry background, displaced worker, PWD, women returner, first-generation graduate.
4. Translate career gap periods into positive capability signals.

Return ONLY valid JSON matching this partial structure:
{
  "inferredSkills": string[],
  "microCertifications": string[],
  "informalCredentials": string[],
  "hasCaregivingSignal": boolean,
  "hasDataEntrySignal": boolean,
  "hasDisplacedWorkerSignal": boolean,
  "hasPwdSignal": boolean,
  "hasWomenReturnerSignal": boolean,
  "hasFirstGenSignal": boolean
}` : SYSTEM_PROMPT;

  try {
    const result = await callGeminiJSON<Partial<ParsedResume>>(
      softPrompt,
      `Parse this resume text and return structured JSON:\n\n---\n${rawText.slice(0, 4000)}\n---`,
      { model: DEFAULT_GEMINI_MODEL, maxTokens: 2048, temperature: 0.1 }
    );

    const baseSkills = isSoftParseOnly
      ? (hardFacts.user_skills || hardFacts.resume_skills || extractSkills(rawText))
      : ensureStringArray(result.skills);

    const baseExp = isSoftParseOnly && hardFacts.experience_analysis?.parsed_history
      ? hardFacts.experience_analysis.parsed_history.map((h: any) => ({
          role: h.title,
          company: h.company,
          duration: `${h.start_date} - ${h.end_date}`,
          durationMonths: h.duration_months,
          skills: [],
          isGap: false,
          confidence: 0.95,
        }))
      : (Array.isArray(result.workExperience) ? result.workExperience : []);

    const baseEdu = isSoftParseOnly && Array.isArray(hardFacts.education_info)
      ? hardFacts.education_info.map((e: any) => ({
          degree: e.degree || 'Degree',
          institution: e.institution || 'University',
          year: String(e.grad_year || ''),
          tier: 'state' as const,
          confidence: 0.9,
        }))
      : (Array.isArray(result.education) ? result.education : []);

    const totalMonths = isSoftParseOnly && hardFacts.experience_analysis?.total_yoe != null
      ? Math.round(hardFacts.experience_analysis.total_yoe * 12)
      : (typeof result.totalExperienceMonths === 'number' ? result.totalExperienceMonths : 0);

    const hasGap = isSoftParseOnly && hardFacts.experience_analysis?.employment_gaps
      ? hardFacts.experience_analysis.employment_gaps.length > 0
      : Boolean(result.hasCareerGap);

    const gapMonths = isSoftParseOnly && hardFacts.experience_analysis?.employment_gaps?.length > 0
      ? hardFacts.experience_analysis.employment_gaps[0].months
      : (typeof result.detectedGapMonths === 'number' ? result.detectedGapMonths : 0);

    return {
      skills: baseSkills,
      inferredSkills: ensureStringArray(result.inferredSkills),
      location: typeof result.location === 'string' ? result.location : (hardFacts?.contact_info?.location || 'India'),
      locationTier: result.locationTier || 'unknown',
      workExperience: baseExp,
      education: baseEdu,
      totalExperienceMonths: totalMonths,
      certifications: ensureStringArray(isSoftParseOnly ? hardFacts?.certifications?.map((c: any) => c.name || c) : result.certifications),
      microCertifications: ensureStringArray(result.microCertifications),
      informalCredentials: ensureStringArray(result.informalCredentials),
      projectWork: Array.isArray(result.projectWork) ? result.projectWork : [],
      selfReportedCapabilities: ensureStringArray(result.selfReportedCapabilities),
      detectedGapMonths: gapMonths,
      hasCareerGap: hasGap,
      gapPeriods: isSoftParseOnly && hardFacts?.experience_analysis?.employment_gaps
        ? hardFacts.experience_analysis.employment_gaps.map((g: any) => ({ start: g.start, end: g.end, durationMonths: g.months }))
        : (Array.isArray(result.gapPeriods) ? result.gapPeriods : []),
      hasCaregivingSignal: Boolean(result.hasCaregivingSignal),
      hasDataEntrySignal: Boolean(result.hasDataEntrySignal),
      hasDisplacedWorkerSignal: Boolean(result.hasDisplacedWorkerSignal),
      hasPwdSignal: Boolean(result.hasPwdSignal),
      hasWomenReturnerSignal: Boolean(result.hasWomenReturnerSignal),
      hasFirstGenSignal: Boolean(result.hasFirstGenSignal),
      overallConfidence: isSoftParseOnly ? 0.92 : (typeof result.overallConfidence === 'number' ? result.overallConfidence : 0.7),
      lowConfidenceFields: ensureStringArray(result.lowConfidenceFields),
      rawText,
    };
  } catch (err) {
    console.warn('[ResumeParserAgent] Gemini failed, using local fallback:', err);
    return localFallbackParse(rawText);
  }
}

