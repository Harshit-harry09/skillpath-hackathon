// updated
// types/profile.ts
export interface UserProfile {
  uid: string;
  display_name: string;
  email: string;
  avatar_color: string;       // generated from name, e.g. "#7F77DD"
  target_role?: string;
  streak_count: number;
  streak_last_date: string;   // "YYYY-MM-DD"
  total_skills_learned: number;
  created_at: string;
}

export interface TimelineEntry {
  id: string;
  skill: string;
  state: 'in_progress' | 'learned';
  job_title: string;
  job_color: string;
  timestamp: string;
}

export interface ProfileStats {
  skills_learned: number;
  streak_count: number;
  market_fit: number;         // = active job readiness score
  weeks_remaining: number;    // estimated
}
