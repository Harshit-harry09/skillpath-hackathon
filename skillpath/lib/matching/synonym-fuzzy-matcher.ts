import Fuse from "fuse.js";

const SYNONYM_MAP: Record<string, string[]> = {
  "javascript": ["js", "ecmascript", "vanilla js"],
  "typescript": ["ts"],
  "react": ["react.js", "reactjs"],
  "next.js": ["nextjs", "next"],
  "node.js": ["nodejs", "node"],
  "postgresql": ["postgres", "pgsql"],
  "mongodb": ["mongo"],
  "amazon web services": ["aws"],
  "google cloud platform": ["gcp"],
  "kubernetes": ["k8s"],
  "docker": ["containers", "containerization"],
  "tailwinds": ["tailwind", "tailwindcss"],
  "python": ["py"],
};

export interface SkillMatchResult {
  skill: string;
  matched: boolean;
  matchedSkill?: string;
  matchType: "exact" | "synonym" | "fuzzy" | "none";
  confidenceScore: number;
}

export function matchSkillWithLayers(targetSkill: string, userSkills: string[]): SkillMatchResult {
  const normTarget = targetSkill.toLowerCase().trim();
  const normUserSkills = userSkills.map((s) => ({ original: s, norm: s.toLowerCase().trim() }));

  // Layer 1: Exact match
  const exact = normUserSkills.find((u) => u.norm === normTarget);
  if (exact) {
    return {
      skill: targetSkill,
      matched: true,
      matchedSkill: exact.original,
      matchType: "exact",
      confidenceScore: 1.0,
    };
  }

  // Layer 2: Synonym match
  const synonyms = SYNONYM_MAP[normTarget] || [];
  const synonymMatch = normUserSkills.find((u) => synonyms.includes(u.norm) || Object.entries(SYNONYM_MAP).some(([key, syns]) => syns.includes(normTarget) && (key === u.norm || syns.includes(u.norm))));
  if (synonymMatch) {
    return {
      skill: targetSkill,
      matched: true,
      matchedSkill: synonymMatch.original,
      matchType: "synonym",
      confidenceScore: 0.92,
    };
  }

  // Layer 3: Fuzzy match via Fuse.js
  const fuse = new Fuse(normUserSkills, {
    keys: ["norm"],
    threshold: 0.3,
  });

  const fuzzyResults = fuse.search(normTarget);
  if (fuzzyResults.length > 0 && fuzzyResults[0].item) {
    return {
      skill: targetSkill,
      matched: true,
      matchedSkill: fuzzyResults[0].item.original,
      matchType: "fuzzy",
      confidenceScore: 0.80,
    };
  }

  return {
    skill: targetSkill,
    matched: false,
    matchType: "none",
    confidenceScore: 0.0,
  };
}

export function matchAllSkills(jdSkills: string[], userSkills: string[]): {
  matchedSkills: string[];
  missingSkills: string[];
  matchDetails: SkillMatchResult[];
} {
  const matchDetails = jdSkills.map((skill) => matchSkillWithLayers(skill, userSkills));
  const matchedSkills = matchDetails.filter((m) => m.matched).map((m) => m.matchedSkill || m.skill);
  const missingSkills = matchDetails.filter((m) => !m.matched).map((m) => m.skill);

  return {
    matchedSkills,
    missingSkills,
    matchDetails,
  };
}
