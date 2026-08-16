import type {
  CertificationItem,
  CompositeATSScore,
  EducationItem,
  ExperienceAnalysis,
  FraudAuditResult,
  JDRequirements,
} from '@/types/analysis';

/**
 * Computes an enterprise-grade 5-Pillar Composite ATS Candidate Score (0-100%).
 *
 * Weightings:
 * - Skills Match (30%)
 * - Experience & YOE Match (30%)
 * - Title & Seniority Progression (15%)
 * - Education & Certifications (15%)
 * - ATS Formatting & Fraud Risk (10%)
 */
export function calculateCompositeATSScore(params: {
  gapScore: number; // 0 to 100 (where 0 gap = 100% skills match)
  experience: ExperienceAnalysis;
  jdReqs: JDRequirements;
  education: EducationItem[];
  certifications: CertificationItem[];
  fraudAudit: FraudAuditResult;
}): CompositeATSScore {
  const { gapScore, experience, jdReqs, education, certifications, fraudAudit } = params;

  const penalties: string[] = [];
  const strengths: string[] = [];

  // Pillar 1: Skills Score (30%)
  const skills_score = Math.max(0, 100 - gapScore);
  if (skills_score >= 80) strengths.push('High technical skill alignment with job requirements.');
  else if (skills_score < 50) penalties.push('Missing core technical skills required by job description.');

  // Pillar 2: Experience & YOE Score (30%)
  let experience_score = 100;
  if (jdReqs.required_yoe > 0) {
    if (experience.relevant_yoe >= jdReqs.required_yoe) {
      experience_score = 100;
      strengths.push(`Meets or exceeds required experience level (${experience.relevant_yoe} YOE vs. ${jdReqs.required_yoe} YOE required).`);
    } else {
      const yoeRatio = experience.relevant_yoe / jdReqs.required_yoe;
      experience_score = Math.round(yoeRatio * 100);
      penalties.push(`Relevant YOE (${experience.relevant_yoe} yrs) is below job requirement (${jdReqs.required_yoe} yrs).`);
    }
  } else {
    experience_score = Math.min(100, Math.max(60, experience.total_yoe * 15));
  }

  // Pillar 3: Title, Potential & Seniority Progression (15%) - Bias-Free Evaluation
  let title_score = 85;
  const seniorityRanks = { entry: 1, mid: 2, senior: 3, lead: 4, executive: 5 };
  const candidateRank = seniorityRanks[experience.seniority_level] || 1;

  if (experience.career_progression === 'accelerated') {
    title_score = 100;
    strengths.push('Demonstrates accelerated career progression and high learning velocity.');
  } else if (experience.career_progression === 'steady') {
    title_score = 90;
  }

  // Inclusive Workforce Rule: Gap Immunity Policy
  if (experience.employment_gaps.length > 0) {
    // Zero deduction! Lived experience & career breaks (caregiving, health, reskilling) are protected
    strengths.push('Gap Non-Penalization Active: Work history evaluated on demonstrated skills, not break duration.');
  }

  // Pillar 4: Skills-First Learning, Education & Certifications (15%)
  // Bias-Free: Demonstrating skills and practical project capability is valued over elite school pedigree
  let education_score = 85; // Inclusive baseline for verified skills / non-traditional pathways
  if (education.length > 0) {
    const highestDegree = education[0].degree;
    if (highestDegree.includes('Master') || highestDegree.includes('Ph.D.')) {
      education_score = 100;
      strengths.push('Holds advanced degree (Master’s or Ph.D.).');
    } else if (highestDegree.includes('Bachelor')) {
      education_score = 95;
      strengths.push('Holds undergraduate degree.');
    } else {
      education_score = 90;
      strengths.push('Holds verified vocational/diploma credential.');
    }
  } else {
    // Non-traditional / self-taught pathway
    education_score = skills_score >= 70 ? 90 : 80;
    strengths.push('Skills-First Accreditation: Practical technical competence evaluated over formal institution name.');
  }

  if (certifications.length > 0) {
    education_score = Math.min(100, education_score + 10);
    strengths.push(`Holds ${certifications.length} verified micro-credential(s) / certification(s).`);
  }

  // Pillar 5: Formatting & Integrity Audit (10%)
  let formatting_score = 100;
  if (fraudAudit.hidden_text_detected) {
    formatting_score -= 50;
    penalties.push('Integrity Warning: Hidden or white text detected in document.');
  }
  if (fraudAudit.keyword_stuffing_score > 0) {
    formatting_score -= Math.round(fraudAudit.keyword_stuffing_score / 2);
    penalties.push(`Formatting Notice: Unnatural keyword density detected.`);
  }

  // Composite Calculation
  const overall_score = Math.round(
    skills_score * 0.30 +
    experience_score * 0.30 +
    title_score * 0.15 +
    education_score * 0.15 +
    formatting_score * 0.10
  );

  return {
    overall_score: Math.max(0, Math.min(100, overall_score)),
    breakdown: {
      skills_score: Math.round(skills_score),
      experience_score: Math.round(experience_score),
      education_score: Math.round(education_score),
      title_score: Math.round(title_score),
      formatting_score: Math.round(formatting_score),
    },
    penalties,
    strengths,
  };
}
