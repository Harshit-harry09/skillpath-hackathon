import type { JDRequirements } from '@/types/analysis';

/**
 * Deterministically parses Job Description text for YOE constraints, work authorization, location model, and degree requirements.
 */
export function analyzeJobDescription(jdText: string, extractedSkills: string[] = []): JDRequirements {
  if (!jdText || !jdText.trim()) {
    return {
      required_yoe: 0,
      location_type: 'unspecified',
      visa_required: false,
      required_degree: 'Bachelor’s Degree',
      must_have_skills: [],
      nice_to_have_skills: [],
    };
  }

  // 1. Required YOE Extraction (e.g. "5+ years", "minimum 3 years of experience", "7-10 yrs")
  const yoeMatch = jdText.match(/(?:at least|minimum|req(?:uire)?d?|with)?\s*(\d{1,2})\s*\+?\s*(?:-\s*\d{1,2}\s*)?(?:years?|yrs?)\b(?:\s*of\s*experience)?/i);
  let required_yoe = 0;
  if (yoeMatch) {
    required_yoe = parseInt(yoeMatch[1], 10);
  } else if (/senior|sr\./i.test(jdText)) {
    required_yoe = 5;
  } else if (/lead|principal/i.test(jdText)) {
    required_yoe = 8;
  }

  // 2. Location Type (Remote vs Hybrid vs On-site)
  let location_type: 'remote' | 'hybrid' | 'on_site' | 'unspecified' = 'unspecified';
  if (/remote|work from home|wfh/i.test(jdText)) {
    location_type = 'remote';
  } else if (/hybrid/i.test(jdText)) {
    location_type = 'hybrid';
  } else if (/on-site|onsite|in-office|relocate/i.test(jdText)) {
    location_type = 'on_site';
  }

  // 3. Visa / Work Authorization Requirement
  const visa_required = /us citizen|green card|work authorization|no visa sponsorship|must be authorized|clearance|security clearance/i.test(jdText);

  // 4. Required Degree Level
  let required_degree = 'Bachelor’s Degree';
  if (/ph\.?d|doctorate/i.test(jdText)) required_degree = 'Ph.D.';
  else if (/master|m\.?s\.?|m\.?t\.?ech|mba/i.test(jdText)) required_degree = 'Master’s Degree';
  else if (/associate/i.test(jdText)) required_degree = 'Associate’s Degree';
  else if (/no degree|high school|diploma/i.test(jdText)) required_degree = 'Not Required';

  // 5. Must Have vs Nice to Have Skill Split
  const must_have_skills: string[] = [];
  const nice_to_have_skills: string[] = [];

  const lowerJd = jdText.toLowerCase();
  const niceSectionIndex = lowerJd.indexOf('nice to have') !== -1 ? lowerJd.indexOf('nice to have') : lowerJd.indexOf('preferred');

  extractedSkills.forEach((skill, idx) => {
    const skillLower = skill.toLowerCase();
    const pos = lowerJd.indexOf(skillLower);

    if (niceSectionIndex !== -1 && pos > niceSectionIndex) {
      nice_to_have_skills.push(skill);
    } else if (idx < 10) {
      must_have_skills.push(skill);
    } else {
      nice_to_have_skills.push(skill);
    }
  });

  return {
    required_yoe,
    location_type,
    visa_required,
    required_degree,
    must_have_skills: must_have_skills.slice(0, 15),
    nice_to_have_skills: nice_to_have_skills.slice(0, 15),
  };
}
