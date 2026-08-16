/**
 * SkillPath Atlas OS — Types & Sub-Agent Interfaces
 */

export type AtlasAgentId =
  | 'resume_parser'
  | 'doubt_resolver'
  | 'skill_graph'
  | 'career_twin'
  | 'opportunity_matcher'
  | 'critic'
  | 'pathfinder'
  | 'learning_roadmap'
  | 'inclusion'
  | 'future_simulator'
  | 'fake_job_guard'
  | 'role_switch_comparison'
  | 'governance';

export interface AtlasAgentTrace {
  timestamp: number;
  agentId: AtlasAgentId;
  agentName: string;
  status: 'running' | 'completed' | 'flagged' | 'adjusted';
  message: string;
  durationMs?: number;
}

export interface AtlasSkill {
  name: string;
  score: number; // 0 to 1
  category?: string;
  informalSource?: string; // e.g. "Mapped from Caregiving"
}

export interface AtlasCareerGap {
  duration_months: number;
  reason: string;
  confirmed: boolean;
  translated_skills: string[];
}

export interface AtlasUserPreferences {
  remote: boolean;
  flexible_hours: boolean;
  relocation_willingness?: boolean;
  learning_hours_per_week?: number;
  target_salary_lpa?: number;
}

export interface AtlasCareerTwin {
  location: string;
  locationTier?: 'metro' | 'tier2' | 'tier3' | 'rural' | 'unknown';
  career_stage: 'first_generation_job_seeker' | 'career_gap_returner' | 'displaced_worker' | 'tier2_3_candidate' | 'pwd_candidate' | 'general_switcher';
  interests: string[];
  skills: AtlasSkill[];
  gap: AtlasCareerGap;
  preferences: AtlasUserPreferences;
  inclusion_flags: string[];
  accessibility_needs: string[];
  hasPwdSignal?: boolean;
  readiness_score: number;
}

export interface AtlasRoleMatch {
  role: string;
  match_score: number; // 0 to 1
  ready_now: boolean;
  weeks_to_ready: number;
  salary_avg_lpa: number;
  salary_avg_usd?: number;
  matching_skills: string[];
  missing_skills: string[];
  is_bridge_role?: boolean;
  fake_job_risk_score?: number; // 0 to 1 (0 = safe)
}

export interface AtlasRoadmapStep {
  week: number;
  title: string;
  description: string;
  key_skills: string[];
  project: string;
}

export interface AtlasFairnessReport {
  gap_penalized: boolean;
  accessibility_checked: boolean;
  tier2_opportunity_enabled: boolean;
  women_returner_support: boolean;
  first_gen_support: boolean;
  fake_job_shield_active: boolean;
  evidence_notes: string[];
}

export interface AtlasDoubtQuestion {
  id: string;
  category: 'gap' | 'goal' | 'accessibility' | 'informal_skills' | 'work_preference';
  question: string;
  options: string[];
  detectedValue?: string;
}

export interface AtlasSimulationInput {
  learning_hours_per_week: number;
  remote_only: boolean;
  relocation_willing: boolean;
  target_salary_lpa: number;
  risk_appetite: 'conservative' | 'moderate' | 'balanced' | 'aggressive';
  completed_projects_count: number;
}

export interface AtlasSimulationResult {
  updated_match_score: number;
  updated_weeks_to_ready: number;
  opportunity_count: number;
  salary_potential_lpa: number;
  projected_roles: string[];
}

export interface AtlasOutput {
  career_twin: AtlasCareerTwin;
  best_role: string;
  match_score: number;
  truth: string;
  bridge_path: string[];
  similar_roles: AtlasRoleMatch[];
  missing_skills: string[];
  roadmap: string[];
  detailed_roadmap: AtlasRoadmapStep[];
  fairness_report: AtlasFairnessReport;
  next_steps: string[];
  doubt_questions: AtlasDoubtQuestion[];
  agent_traces: AtlasAgentTrace[];
}
