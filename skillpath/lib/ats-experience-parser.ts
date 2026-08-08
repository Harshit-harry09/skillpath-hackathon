import type { ExperienceAnalysis, WorkExperienceItem } from '@/types/analysis';

const SENIORITY_KEYWORDS: Record<string, 'entry' | 'mid' | 'senior' | 'lead' | 'executive'> = {
  intern: 'entry',
  junior: 'entry',
  associate: 'entry',
  entry: 'entry',
  mid: 'mid',
  intermediate: 'mid',
  senior: 'senior',
  sr: 'senior',
  principal: 'lead',
  lead: 'lead',
  staff: 'lead',
  head: 'executive',
  vp: 'executive',
  director: 'executive',
  chief: 'executive',
  cto: 'executive',
  ceo: 'executive',
};

const MONTH_NAMES: Record<string, number> = {
  jan: 0, january: 0,
  feb: 1, february: 1,
  mar: 2, march: 2,
  apr: 3, april: 3,
  may: 4,
  jun: 5, june: 5,
  jul: 6, july: 6,
  aug: 7, august: 7,
  sep: 8, sept: 8, september: 8,
  oct: 9, october: 9,
  nov: 10, november: 10,
  dec: 11, december: 11,
};

function parseYearMonth(dateStr: string): { year: number; month: number } | null {
  const clean = dateStr.trim().toLowerCase();
  if (clean.includes('present') || clean.includes('current') || clean.includes('now')) {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  }

  // Matches "Jan 2021", "January 2021", "01/2021", "2021"
  const m = clean.match(/([a-z]+|\d{1,2})?\s*[\/-]?\s*(\d{4})/);
  if (!m) return null;

  const year = parseInt(m[2], 10);
  let month = 0;

  if (m[1]) {
    if (/^\d+$/.test(m[1])) {
      month = Math.max(0, Math.min(11, parseInt(m[1], 10) - 1));
    } else if (MONTH_NAMES[m[1]]) {
      month = MONTH_NAMES[m[1]];
    }
  }

  return { year, month };
}

/**
 * Deterministically parses work experience, job titles, date ranges, total YOE, seniority, and employment gaps.
 */
export function parseWorkExperience(resumeText: string, jdSkills: string[] = []): ExperienceAnalysis {
  if (!resumeText || !resumeText.trim()) {
    return {
      total_yoe: 0,
      relevant_yoe: 0,
      seniority_level: 'entry',
      career_progression: 'unclear',
      employment_gaps: [],
      parsed_history: [],
    };
  }

  // Regex to match date ranges like "Jan 2020 - Present", "2018 - 2021", "06/2019 to 08/2022"
  const dateRangeRegex = /(?:(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|January|February|March|April|June|July|August|September|October|November|December|\d{1,2})\s*[\/-]?\s*)?(\d{4})\s*(?:-|to|–|—)\s*(?:(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|January|February|March|April|June|July|August|September|October|November|December|\d{1,2})\s*[\/-]?\s*)?(\d{4}|Present|Current|Now)/gi;

  const matches = [...resumeText.matchAll(dateRangeRegex)];
  const parsed_history: WorkExperienceItem[] = [];

  let highestSeniority: 'entry' | 'mid' | 'senior' | 'lead' | 'executive' = 'entry';
  const seniorityRanks = { entry: 1, mid: 2, senior: 3, lead: 4, executive: 5 };

  let totalMonthsAccumulated = 0;
  let relevantMonthsAccumulated = 0;

  // Extract lines surrounding each date match to infer company & title
  const textLines = resumeText.split('\n').map((l) => l.trim()).filter(Boolean);

  matches.forEach((match, idx) => {
    const rawDateRange = match[0];
    const startDateStr = `${match[1] || ''} ${match[2]}`.trim();
    const endDateStr = `${match[3] || ''} ${match[4]}`.trim();

    const startObj = parseYearMonth(startDateStr);
    const endObj = parseYearMonth(endDateStr);

    let duration_months = 0;
    if (startObj && endObj) {
      duration_months = Math.max(1, (endObj.year - startObj.year) * 12 + (endObj.month - startObj.month));
    } else {
      duration_months = 12; // default assumption if date parsing fuzzy
    }

    totalMonthsAccumulated += duration_months;

    // Find nearby line for job title & company
    const lineIndex = textLines.findIndex((l) => l.includes(match[0]) || l.includes(match[2]));
    let title = 'Software Engineer / Professional';
    let company = 'Company / Organization';
    const bullet_points: string[] = [];

    if (lineIndex !== -1) {
      const prevLine = lineIndex > 0 ? textLines[lineIndex - 1] : '';
      const currLine = textLines[lineIndex];
      const nextLine = lineIndex + 1 < textLines.length ? textLines[lineIndex + 1] : '';

      if (prevLine && !prevLine.match(/\d{4}/)) {
        title = prevLine;
        company = currLine.replace(rawDateRange, '').trim() || 'Company';
      } else {
        title = currLine.replace(rawDateRange, '').trim() || 'Role Title';
        company = nextLine && !nextLine.match(/\d{4}/) ? nextLine : 'Company';
      }
    }

    // Infer Seniority
    const titleLower = title.toLowerCase();
    for (const [kw, level] of Object.entries(SENIORITY_KEYWORDS)) {
      if (titleLower.includes(kw)) {
        if (seniorityRanks[level] > seniorityRanks[highestSeniority]) {
          highestSeniority = level;
        }
        break;
      }
    }

    // Check relevant YOE by matching skills in nearby context
    const contextSnippet = textLines.slice(Math.max(0, lineIndex - 1), lineIndex + 5).join(' ').toLowerCase();
    const matchesJdSkill = jdSkills.some((s) => contextSnippet.includes(s.toLowerCase()));

    if (matchesJdSkill || jdSkills.length === 0) {
      relevantMonthsAccumulated += duration_months;
    }

    parsed_history.push({
      id: `exp_${idx + 1}`,
      company: company || 'Employer',
      title: title || 'Professional Role',
      start_date: startDateStr,
      end_date: endDateStr,
      duration_months,
      is_current: endDateStr.toLowerCase().includes('present') || endDateStr.toLowerCase().includes('current'),
      bullet_points,
    });
  });

  const total_yoe = Math.round((totalMonthsAccumulated / 12) * 10) / 10;
  const relevant_yoe = Math.min(total_yoe, Math.round((relevantMonthsAccumulated / 12) * 10) / 10);

  // Overall Seniority fallback based on total YOE if no keyword hit
  const currentRank = seniorityRanks[highestSeniority];
  if (currentRank === 1) {
    if (total_yoe >= 10) highestSeniority = 'lead';
    else if (total_yoe >= 5) highestSeniority = 'senior';
    else if (total_yoe >= 2) highestSeniority = 'mid';
  }

  // Detect Employment Gaps (> 6 months between consecutive jobs)
  const employment_gaps: Array<{ start: string; end: string; months: number }> = [];
  if (parsed_history.length >= 2) {
    for (let i = 0; i < parsed_history.length - 1; i++) {
      const prevEnd = parseYearMonth(parsed_history[i + 1].end_date);
      const nextStart = parseYearMonth(parsed_history[i].start_date);

      if (prevEnd && nextStart) {
        const gapMonths = (nextStart.year - prevEnd.year) * 12 + (nextStart.month - prevEnd.month);
        if (gapMonths > 6) {
          employment_gaps.push({
            start: parsed_history[i + 1].end_date,
            end: parsed_history[i].start_date,
            months: gapMonths,
          });
        }
      }
    }
  }

  // Progression Trend
  let career_progression: 'accelerated' | 'steady' | 'flat' | 'unclear' = 'steady';
  if (parsed_history.length >= 2) {
    if (seniorityRanks[highestSeniority] >= 3) {
      career_progression = total_yoe <= 5 ? 'accelerated' : 'steady';
    }
  } else if (parsed_history.length === 0) {
    career_progression = 'unclear';
  }

  return {
    total_yoe,
    relevant_yoe,
    seniority_level: highestSeniority,
    career_progression,
    employment_gaps,
    parsed_history,
  };
}
