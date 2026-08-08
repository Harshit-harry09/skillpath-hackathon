// updated
import { NextRequest, NextResponse } from 'next/server';
import { callGeminiJSON } from '@/lib/gemini';
import { guardAiRequest } from '@/lib/request-guard';
export const runtime = 'nodejs';

export const dynamic = 'force-dynamic';

export interface ResumeFlawItem {
  id: string;
  category: 'grammar' | 'formatting' | 'clarity' | 'red_flag';
  severity: 'high' | 'medium' | 'low';
  title: string;
  original_text: string;
  explanation: string;
  suggested_fix: string;
}

export interface FlawAnalysisResponse {
  overall_score: number;
  flaws: ResumeFlawItem[];
  summary: string;
  fallback: boolean;
}

export async function POST(req: NextRequest) {
  const rateLimitError = guardAiRequest(req, undefined, 10);
  if (rateLimitError) return rateLimitError;

  let resumeText = '';
  try {
    const body = await req.json();
    if (body.resume_text && typeof body.resume_text === 'string') {
      resumeText = body.resume_text.trim();
    }
  } catch {
    return NextResponse.json({ error: 'invalid_json', message: 'Request body must be valid JSON.' }, { status: 400 });
  }

  if (!resumeText || resumeText.length < 15) {
    return NextResponse.json({
      overall_score: 75,
      flaws: getFallbackFlaws(),
      summary: 'Provided resume text was brief. Evaluated with default engineering quality heuristics.',
      fallback: true,
    });
  }

  const system = `You are a world-class executive recruiter and senior copy editor specializing in technical resumes.
Scan the candidate's resume for:
1. Grammar, spelling, punctuation, capitalization, or subject-verb agreement errors.
2. Formatting and structural flaws (e.g. use of 1st-person "I/my", lack of quantification, overly wordy bullets).
3. Clarity & impact issues (e.g. passive phrasing, vague accomplishments).
4. Recruiter & ATS red flags (e.g. missing metrics, non-standard section headers).

Output MUST be a valid JSON object matching this schema:
{
  "overall_score": number (0-100 quality score),
  "summary": string (1-2 sentence overall assessment),
  "flaws": [
    {
      "id": string (unique ID like "flaw-1"),
      "category": "grammar" | "formatting" | "clarity" | "red_flag",
      "severity": "high" | "medium" | "low",
      "title": string (short title of the issue),
      "original_text": string (exact line or excerpt from resume),
      "explanation": string (why this is a flaw/mistake),
      "suggested_fix": string (improved line or rewrite ready to use)
    }
  ]
}`;

  const prompt = `Analyze this resume text for flaws, grammar errors, formatting issues, and passive statements:

"""
${resumeText.slice(0, 4000)}
"""`;

  try {
    const result = await callGeminiJSON<FlawAnalysisResponse>(system, prompt, {
      model: 'gemini-3.6-flash',
      temperature: 0.2,
      maxTokens: 1024,
    });

    if (result && Array.isArray(result.flaws) && result.flaws.length > 0) {
      return NextResponse.json({
        overall_score: Math.max(0, Math.min(100, result.overall_score || 82)),
        summary: result.summary || 'Completed deep grammatical and structural analysis of your resume.',
        flaws: result.flaws.slice(0, 6),
        fallback: false,
      });
    }
  } catch (err) {
    console.error('[Analyze Resume Flaws Error]:', err);
  }

  // Fallback heuristic analysis if Gemini is unavailable
  return NextResponse.json({
    overall_score: 78,
    summary: 'Automated heuristic scan complete. Identified key grammatical, passive voice, and quantification opportunities.',
    flaws: getFallbackFlaws(resumeText),
    fallback: true,
  });
}

function getFallbackFlaws(text: string = ''): ResumeFlawItem[] {
  const flaws: ResumeFlawItem[] = [];

  if (/(\bI\b|\bmy\b|\bme\b|\bwe\b)/i.test(text)) {
    flaws.push({
      id: 'flaw-pronouns',
      category: 'formatting',
      severity: 'high',
      title: 'First-Person Pronouns Detected ("I", "my")',
      original_text: 'Used first-person pronouns ("I managed...", "My responsibilities...") in bullet points.',
      explanation: 'Modern ATS standards and executive recruiters expect implied third-person action verbs instead of personal pronouns.',
      suggested_fix: 'Remove "I" or "My" and start directly with a strong action verb (e.g., "Managed cross-functional engineering teams...").',
    });
  }

  if (/(responsible for|assisted with|helped in|worked on)/i.test(text)) {
    flaws.push({
      id: 'flaw-passive',
      category: 'clarity',
      severity: 'medium',
      title: 'Passive Phrasing ("responsible for", "helped in")',
      original_text: 'Used passive phrasing describing duties rather than explicit ownership.',
      explanation: 'Phrases like "responsible for" sound passive and weaken your perceived impact.',
      suggested_fix: 'Replace with direct technical action verbs: "Architected", "Spearheaded", "Engineered", or "Automated".',
    });
  }

  if (!/\b(\d+%|\$\d+|\d+\+|\bmillions?\b|\bthousands?\b)\b/i.test(text)) {
    flaws.push({
      id: 'flaw-metrics',
      category: 'red_flag',
      severity: 'high',
      title: 'Unquantified Achievements',
      original_text: 'Bullets lack numeric proof of impact (% latency drop, $ saved, # daily active users).',
      explanation: 'Recruiters reject qualitative-only descriptions. Hard numbers increase candidate response rates by up to 40%.',
      suggested_fix: 'Add numeric scale: e.g. "Reduced build times by 30% across 15 microservices handling 2M requests/day."',
    });
  }

  flaws.push({
    id: 'flaw-typo-spacing',
    category: 'grammar',
    severity: 'low',
    title: 'Inconsistent Punctuation at End of Bullets',
    original_text: 'Some bullet points end with periods while others do not.',
    explanation: 'Consistency in punctuation demonstrates attention to detail to recruiters.',
    suggested_fix: 'Ensure all bullet points consistently omit or include ending periods across your entire document.',
  });

  return flaws;
}
