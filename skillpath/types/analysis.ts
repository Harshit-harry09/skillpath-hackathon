// updated
// ---- Analysis Types ----

export type ConfidenceLevel = 'never_used' | 'heard_of_it' | 'used_it' | 'comfortable' | 'strong';

export type EvidenceMatchStatus =
  | 'matched'
  | 'partially_matched'
  | 'transferable'
  | 'missing'
  | 'contradicted'
  | 'unclear';

export type RequirementImportance = 'must_have' | 'should_have' | 'nice_to_have';

export interface SkillEvidenceDetail {
  quote: string;
  section?: string;
  years?: number;
  recency_year?: number;
  strength?: 'strong' | 'moderate' | 'weak' | 'unclear';
}

export interface AnalysisEvidence {
  id: string;
  source: 'resume' | 'job_description';
  skill: string;
  canonical_skill: string;
  quote: string;
  section?: string;
  years?: number;
  recency_year?: number;
  strength?: 'strong' | 'moderate' | 'weak' | 'unclear';
  confidence: number;
}

export interface AnalysisRequirement {
  id: string;
  skill: string;
  canonical_skill: string;
  importance: RequirementImportance;
  quote: string;
  minimum_years?: number;
  confidence: number;
}

export interface AnalysisMatch {
  requirement_id: string;
  status: EvidenceMatchStatus;
  evidence_ids: string[];
  similarity?: number;
  reason: string;
  confidence: number;
}

export interface AnalysisExplanation {
  summary: string;
  top_strengths: Array<{ skill: string; evidence_ids: string[] }>;
  top_gaps: Array<{ skill: string; reason: string; requirement_ids: string[] }>;
  next_actions: string[];
}

export interface SkillGap {
  skill: string;
  priority: number;
  weeks_to_learn: number;
  reason: string;
  in_mvc: boolean;
  match_status?: EvidenceMatchStatus;
  importance?: RequirementImportance;
  requirement_id?: string;
  evidence_ids?: string[];
  evidence_quotes?: string[];
  evidence_details?: SkillEvidenceDetail[];
  confidence?: number;
  category?: string;
  premium?: number;
  trend?: Record<string, number>;
  // Confidence self-assessment (optional — only set after user rates)
  confidence_level?: ConfidenceLevel;
  confidence_weight?: number;
  adjusted_priority?: number;
  // Feature 1 & 2 extensions
  note?: string;
  note_updated_at?: string;
  role_category?: import('./active-job').AppRole;
}

export interface Resource {
  title: string;
  url: string;
  start_at?: string;
  skip_note?: string;
  project?: string;
  project_url?: string;
  why?: string;
  source?: string;
}

export interface SkillResources {
  focus_summary: string;
  estimated_weeks: number;
  resources: Resource[];
}

export interface WeekPlan {
  week: number;
  skill: string;
  resources: Resource[];
}

export interface LearningPlan {
  weeks: WeekPlan[];
}

export interface TrajectoryInfo {
  current_level: string;
  current_role_label: string;
  next_role_label: string | null;
  salary_jump: number;
  delta_skills: string[];
  current_salary: number;
  next_salary: number;
  full_path: Array<{
    level: string;
    label: string;
    salary: number;
    skills: string[];
  }>;
}

export interface ContactInfo {
  name: string | null;
  email: string | null;
  phone: string | null;
  location: string | null;
  linkedin_url: string | null;
  github_url: string | null;
  portfolio_url: string | null;
}

export interface WorkExperienceItem {
  id: string;
  company: string;
  title: string;
  start_date: string;
  end_date: string;
  duration_months: number;
  is_current: boolean;
  bullet_points: string[];
}

export interface ExperienceAnalysis {
  total_yoe: number;
  relevant_yoe: number;
  seniority_level: 'entry' | 'mid' | 'senior' | 'lead' | 'executive';
  career_progression: 'accelerated' | 'steady' | 'flat' | 'unclear';
  employment_gaps: Array<{ start: string; end: string; months: number }>;
  parsed_history: WorkExperienceItem[];
}

export interface EducationItem {
  degree: string;
  field_of_study: string;
  institution: string;
  grad_year: number | null;
  gpa?: string;
}

export interface CertificationItem {
  name: string;
  issuer: string;
  year: number | null;
  validity_status: 'valid' | 'expired' | 'unknown';
}

export interface FraudAuditResult {
  is_flagged: boolean;
  risk_level: 'clean' | 'low' | 'medium' | 'high';
  hidden_text_detected: boolean;
  keyword_stuffing_score: number;
  fraud_flags: string[];
  formatting_issues: string[];
}

export interface JDRequirements {
  required_yoe: number;
  location_type: 'remote' | 'hybrid' | 'on_site' | 'unspecified';
  visa_required: boolean;
  required_degree: string;
  must_have_skills: string[];
  nice_to_have_skills: string[];
}

export interface CompositeATSScore {
  overall_score: number;
  breakdown: {
    skills_score: number;
    experience_score: number;
    education_score: number;
    title_score: number;
    formatting_score: number;
  };
  penalties: string[];
  strengths: string[];
}

export interface KeywordBountyItem {
  skill: string;
  scoreImpact: number;
  placement: 'summary' | 'skills' | 'experience' | 'project';
  suggestedLine: string;
  priority: 'high' | 'medium' | 'low';
}

export interface AnalysisResult {
  share_token: string;
  gap_score: number;
  mvc_skills: string[];
  ready_by_date: string;
  weeks_required: number;
  company_type: string;
  role_category?: string;
  role_label?: string;
  jd_skills: string[];
  resume_skills: string[];
  skill_gaps: SkillGap[];
  learning_plan?: LearningPlan;
  learning_plan_source?: 'gemini' | 'deterministic_fallback' | 'deterministic_empty';
  jd_preview: string;
  summary?: string;
  created_at: string;
  generated_resources?: Record<string, SkillResources>;
  assessments?: Record<string, ConfidenceLevel>;
  user_skills?: string[];
  matched_skills?: string[];
  trajectory?: TrajectoryInfo;
  foundational_prerequisites?: string[];
  enrichment_status?: 'not_configured' | 'pending' | 'processing' | 'complete' | 'fallback' | 'unavailable' | 'deterministic_complete';
  enrichment_error?: string;
  score_source?: string;
  ai_model?: string;
  ai_prompt_version?: string;
  evidence_version?: string;
  evidence?: AnalysisEvidence[];
  requirements?: AnalysisRequirement[];
  matches?: AnalysisMatch[];
  ai_explanation?: AnalysisExplanation;
  resume_text?: string;
  jd_text?: string;
  // Extended ATS properties
  contact_info?: ContactInfo;
  experience_analysis?: ExperienceAnalysis;
  education_info?: EducationItem[];
  certifications?: CertificationItem[];
  fraud_audit?: FraudAuditResult;
  jd_requirements?: JDRequirements;
  composite_ats_score?: CompositeATSScore;
  missing_skills?: string[];
  parsed_text?: string;
  pdf_url?: string;
}

export interface AnalysisRequest {
  jd_text: string;
  resume_text: string;
}

// ---- Skill Types ----

export interface NormalizedSkill {
  canonical: string;
  variants: string[];
}

// ---- MVC Types ----

export interface MVCSkillEntry {
  skill: string;
  count?: number;
  frequency?: number;
  premium?: number;
  trend?: Record<string, number>;
}

export interface MVCRoleData {
  skills: MVCSkillEntry[];
  required_degree?: string;
}

export interface MVCProfiles {
  [role: string]: MVCRoleData | MVCSkillEntry[];
}
