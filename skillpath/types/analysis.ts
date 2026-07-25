// ---- Analysis Types ----

export type ConfidenceLevel = 'never_used' | 'heard_of_it' | 'used_it' | 'comfortable' | 'strong';

export interface SkillGap {
  skill: string;
  priority: number;
  weeks_to_learn: number;
  reason: string;
  in_mvc: boolean;
  category?: string;
  premium?: number;
  trend?: Record<string, number>;
  // Confidence self-assessment (optional — only set after user rates)
  confidence_level?: ConfidenceLevel;
  confidence_weight?: number;
  adjusted_priority?: number;
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
  jd_preview: string;
  summary?: string;
  created_at: string;
  generated_resources?: Record<string, SkillResources>;
  assessments?: Record<string, ConfidenceLevel>;
  user_skills?: string[];
  matched_skills?: string[];
  trajectory?: TrajectoryInfo;
  foundational_prerequisites?: string[];
  resume_text?: string;
  jd_text?: string;
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
