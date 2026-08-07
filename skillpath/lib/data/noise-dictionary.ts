// updated
/**
 * Expert Noise Dictionary for SkillPath Local Refiner
 * Categorized list of non-technical words and "corporate noise"
 * to be stripped from skill extraction.
 */

export const ACTION_VERBS = [
  "managed", "led", "developed", "optimized", "spearheaded", "implemented", 
  "designed", "coordinated", "collaborated", "achieved", "improved", "increased",
  "reduced", "saved", "created", "built", "launched", "maintained", "supported",
  "trained", "mentored", "supervised", "oversaw", "directed", "executed",
  "produced", "delivered", "identified", "resolved", "solved", "negotiated",
  "presented", "facilitated", "automated", "strengthened", "transformed"
];

export const SOFT_SKILLS = [
  "leadership", "communication", "teamwork", "flexibility", "adaptability",
  "problem-solving", "time-management", "organization", "creativity", "innovation",
  "critical-thinking", "emotional-intelligence", "negotiation", "conflict-resolution",
  "public-speaking", "presentation", "writing", "interpersonal", "empathy",
  "active-listening", "customer-service", "attention-to-detail", "multitasking",
  "collaboration", "strategic-thinking", "decision-making", "work-ethic"
];

export const CORPORATE_NOISE = [
  "passionate", "results-driven", "proven-track-record", "excellent", "skilled",
  "expert", "professional", "highly-motivated", "dedicated", "detail-oriented",
  "energetic", "dynamic", "innovative", "successful", "impactful", "top-tier",
  "seasoned", "visionary", "reliable", "proactive", "self-starter", "fast-learner",
  "enthusiastic", "committed", "exceptional", "ambitious", "team-player"
];

export const GENERIC_TERMS = [
  "data", "process", "system", "daily", "success", "performance", "growth",
  "quality", "efficiency", "impact", "results", "solutions", "environment",
  "projects", "tasks", "experience", "skills", "ability", "knowledge",
  "proficiency", "understanding", "familiarity", "standard", "industry",
  "market", "business", "clients", "customers", "users", "requirements"
];

// Combine all into a single rejection set for O(1) lookup
export const NOISE_BLACKSET = new Set([
  ...ACTION_VERBS,
  ...SOFT_SKILLS,
  ...CORPORATE_NOISE,
  ...GENERIC_TERMS
]);
