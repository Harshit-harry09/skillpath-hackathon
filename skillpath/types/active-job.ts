// types/active-job.ts

export type SkillState = 'not_started' | 'in_progress' | 'learned';

export type ConfidenceLevel = 'never_used' | 'heard_of_it' | 'used_it' | 'comfortable' | 'strong';

export type AppRole = 'user' | 'admin' | 'authority' | 'hospital' | 'investigator' | 'reviewer';

export interface TrackedSkill {
  skill: string;
  priority: number;
  weeks_to_learn: number;
  in_mvc: boolean;
  reason: string;
  state: SkillState;
  learned_at?: string;
  resources_generated: boolean;
  // Feature 1: User reflection note
  note?: string;
  note_updated_at?: string;
  // Feature 2: Role-aware categorization
  role_category?: AppRole;
  // Salary premium boost
  premium?: number;
  // Confidence self-assessment (optional)
  confidence_level?: ConfidenceLevel;
  confidence_weight?: number;
  adjusted_priority?: number;
  self_assessed_at?: string;
}

export interface ActiveJob {
  id: string;
  analysis_id: string;
  job_title: string;
  company_type: string;
  role: string;
  seniority: string;
  pinned_at: string;
  color: string;
  skills: TrackedSkill[];
  readiness_score: number;
  baseline_score?: number;
  current_role_filter?: AppRole;
  resume_skills?: string[];
}

export interface ArchivedJob extends ActiveJob {
  archived_at: string;
  final_score: number;
}

