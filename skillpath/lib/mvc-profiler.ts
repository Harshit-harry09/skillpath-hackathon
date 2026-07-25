/**
 * MVC Profiler — finds the 4-5 "deal-breaker" skills
 * by cross-referencing the user's missing skills against
 * our trained MVC model (frequency data from 5000+ JDs).
 */

import type { MVCProfiles, SkillGap } from "@/types/analysis";
import mvcData from "./data/mvc_model.json";
import skillTrends from "./data/skill_trends.json";
import { findFuzzyMatch } from "./fuzzy";


// Mapping of internal role slugs to user-friendly labels for UI display
const ROLE_LABELS: Record<string, string> = {
  "executive": "Executive",
  "engineering-leadership": "Engineering Leadership",
  "product-leadership": "Product Leadership",
  "marketing-leadership": "Marketing Leadership",
  "finance-leadership": "Finance Leadership",
  "operations-leadership": "Operations Leadership",
  "data-leadership": "Data Leadership",
  "it-leadership": "IT Leadership",
  "hr-leadership": "HR Leadership",
  "ai-researcher": "AI Researcher",
  "ml-engineer": "ML Engineer",
  "recruiter": "Recruiter",
  "growth-hacker": "Growth Hacker",
  "solutions-architect": "Solutions Architect",
  "blockchain-developer": "Blockchain Developer",
  "game-developer": "Game Developer",
  "cybersecurity": "Cybersecurity",
  "robotics-engineer": "Robotics Engineer",
  "hardware-engineer": "Hardware Engineer",
  "network-engineer": "Network Engineer",
  "database-admin": "Database Admin",
  "mobile-developer": "Mobile Developer",
  "frontend-developer": "Frontend Developer",
  "backend-developer": "Backend Developer",
  "fullstack-developer": "Fullstack Developer",
  "devops": "DevOps",
  "qa-engineer": "QA Engineer",
  "embedded-systems": "Embedded Systems",
  "cloud-infra": "Cloud Infrastructure",
  "data-engineer": "Data Engineer",
  "product-manager": "Product Manager",
  "technical-program-manager": "Technical Program Manager",
  "scrum-master": "Scrum Master",
  "project-manager": "Project Manager",
  "operations-manager": "Operations Manager",
  "business-analyst": "Business Analyst",
  "finance": "Finance",
  "risk-compliance": "Risk & Compliance",
  "supply-chain": "Supply Chain",
  "data-professional": "Data Professional",
  "sales-engineer": "Sales Engineer",
  "sales-manager": "Sales Manager",
  "sales": "Sales",
  "performance-marketer": "Performance Marketer",
  "brand-manager": "Brand Manager",
  "marketing": "Marketing",
  "customer-success": "Customer Success",
  "support": "Support",
  "consultant": "Consultant",
  "hr": "HR",
  "legal": "Legal",
  "designer": "Designer",
  "content-creator": "Content Creator",
  "technical-writer": "Technical Writer",
  "graphic-designer": "Graphic Designer",
  "healthcare-analyst": "Healthcare Analyst",
  "healthcare-practitioner": "Healthcare Practitioner",
  "scientist": "Scientist",
  "educator": "Educator",
  "software-engineer": "Software Engineer",
  "other": "Other"
};

const mvcProfiles: MVCProfiles = mvcData as MVCProfiles;
const DYNAMIC_ROLES = Object.keys(mvcProfiles);

export function getRoleLabel(slug: string): string {
  if (ROLE_LABELS[slug]) return ROLE_LABELS[slug];
  if (mvcProfiles[slug] && !Array.isArray(mvcProfiles[slug])) {
    return (mvcProfiles[slug] as any).role || slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  }
  return slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Detect the role category from the JD text.
 * Combines the 62 curated high-fidelity roles with the dynamic Mega-Model fallback.
 */
export function detectRoleCategory(jdText: string): string {
  const t = jdText.toLowerCase();

  // Extract Seniority
  let seniority = "mid";
  if (t.includes("junior") || t.includes("jr") || t.includes("entry") || t.includes("associate")) seniority = "junior";
  else if (t.includes("senior") || t.includes("sr") || t.includes("lead") || t.includes("staff") || t.includes("principal")) seniority = "senior";
  else if (t.includes("vp") || t.includes("director") || t.includes("head of") || t.includes("chief") || t.includes("executive")) seniority = "executive";

  let baseRole = "other";

  // 1. Executive / Leadership
  if (t.includes("chief executive") || t.includes(" ceo") || t.includes("founder") || t.includes("managing director") || t.includes("president")) baseRole = "executive";
  else if (t.includes("chief technology") || t.includes(" cto") || t.includes("chief architect") || t.includes("vp engineering") || t.includes("head of engineering")) baseRole = "engineering-leadership";
  else if (t.includes("chief product") || t.includes(" cpo") || t.includes("vp product") || t.includes("head of product")) baseRole = "product-leadership";
  else if (t.includes("chief marketing") || t.includes(" cmo") || t.includes("vp marketing") || t.includes("head of marketing")) baseRole = "marketing-leadership";
  else if (t.includes("chief financial") || t.includes(" cfo") || t.includes("vp finance") || t.includes("head of finance")) baseRole = "finance-leadership";
  else if (t.includes("chief operating") || t.includes(" coo") || t.includes("vp operations") || t.includes("head of operations")) baseRole = "operations-leadership";
  else if (t.includes("chief data") || t.includes(" cdo") || t.includes("chief ai") || t.includes("vp data") || t.includes("head of data")) baseRole = "data-leadership";
  else if (t.includes("chief information") || t.includes(" cio") || t.includes("chief security") || t.includes(" ciso")) baseRole = "it-leadership";
  else if (t.includes("chief people") || t.includes("chief hr") || t.includes("vp people") || t.includes("head of hr")) baseRole = "hr-leadership";

  // 2. Specialized Engineering / Science
  else if (t.includes("machine learning scientist") || t.includes("ai researcher") || t.includes("deep learning") || t.includes("llm researcher")) baseRole = "ai-researcher";
  else if (t.includes("machine learning engineer") || t.includes("ml engineer") || t.includes("mle") || t.includes("mlops") || t.includes("ai engineer")) baseRole = "ml-engineer";
  else if (t.includes("talent acquisition") || t.includes("recruiter") || t.includes("headhunter")) baseRole = "recruiter";
  else if (t.includes("growth hacker") || t.includes("growth engineer")) baseRole = "growth-hacker";
  else if (t.includes("solutions architect") || t.includes("cloud architect") || t.includes("enterprise architect")) baseRole = "solutions-architect";
  else if (t.includes("blockchain") || t.includes("solidity") || t.includes("web3") || t.includes("crypto") || t.includes("smart contract")) baseRole = "blockchain-developer";
  else if (t.includes("game") || t.includes("unity") || t.includes("unreal") || t.includes("gameplay")) baseRole = "game-developer";
  else if (t.includes("cyber") || t.includes("security engineer") || t.includes("infosec") || t.includes("penetration") || t.includes("pentester") || t.includes("hacker")) baseRole = "cybersecurity";
  else if (t.includes("robotics") || t.includes("ros engineer") || t.includes("mechatronics")) baseRole = "robotics-engineer";
  else if (t.includes("hardware engineer") || t.includes("vlsi") || t.includes("circuit design") || t.includes("electrical engineer")) baseRole = "hardware-engineer";
  else if (t.includes("network engineer") || t.includes("network administrator") || t.includes("cisco")) baseRole = "network-engineer";
  else if (t.includes("database administrator") || t.includes("dba") || t.includes("database engineer")) baseRole = "database-admin";

  // 3. Mainstream Development
  else if (t.includes("mobile") || t.includes("ios") || t.includes("android") || t.includes("swift") || t.includes("kotlin") || t.includes("flutter")) baseRole = "mobile-developer";
  else if (t.includes("frontend") || t.includes("front-end") || t.includes("react") || t.includes("next.js") || t.includes("vue") || t.includes("angular")) baseRole = "frontend-developer";
  else if (t.includes("backend") || t.includes("back-end") || t.includes("node.js") || t.includes("go engineer") || t.includes("django") || t.includes("laravel")) baseRole = "backend-developer";
  else if (t.includes("full stack") || t.includes("fullstack") || t.includes("full-stack")) baseRole = "fullstack-developer";
  else if (t.includes("devops") || t.includes("sre") || t.includes("site reliability") || t.includes("platform engineer")) baseRole = "devops";
  else if (t.includes("qa") || t.includes("quality assurance") || t.includes("test engineer") || t.includes("automation") || t.includes("sdet")) baseRole = "qa-engineer";
  else if (t.includes("embedded") || t.includes("firmware") || t.includes("microcontroller") || t.includes("rtos")) baseRole = "embedded-systems";
  else if (t.includes("cloud") || t.includes("infrastructure") || t.includes("aws") || t.includes("azure") || t.includes("kubernetes")) baseRole = "cloud-infra";
  else if (t.includes("data engineer") || t.includes("etl") || t.includes("data pipeline") || t.includes("analytics engineer")) baseRole = "data-engineer";

  // 4. Product / Management
  else if (t.includes("product manager") || t.includes("product owner") || t.includes("product lead")) baseRole = "product-manager";
  else if (t.includes("technical program manager") || t.includes("tpm")) baseRole = "technical-program-manager";
  else if (t.includes("scrum master") || t.includes("agile coach")) baseRole = "scrum-master";
  else if (t.includes("project manager") || t.includes("pmp") || t.includes("program manager")) baseRole = "project-manager";
  else if (t.includes("operations manager") || t.includes("operations lead") || t.includes("biz ops")) baseRole = "operations-manager";
  else if (t.includes("business analyst") || t.includes("business systems analyst")) baseRole = "business-analyst";

  // 5. Finance / Data Analysis
  else if (t.includes("financial planning") || t.includes("finance manager") || t.includes("accounting") || t.includes("fp&a")) baseRole = "finance";
  else if (t.includes("risk analyst") || t.includes("risk manager") || t.includes("compliance officer")) baseRole = "risk-compliance";
  else if (t.includes("supply chain") || t.includes("logistics") || t.includes("procurement")) baseRole = "supply-chain";
  else if (t.includes("data analyst") || t.includes("data scientist") || t.includes("machine learning") || t.includes("bi analyst")) baseRole = "data-professional";

  // 6. Sales
  else if (t.includes("sales engineer") || t.includes("presales") || t.includes("solution engineer")) baseRole = "sales-engineer";
  else if (t.includes("sales manager") || t.includes("sales director") || t.includes("vp sales") || t.includes("head of sales")) baseRole = "sales-manager";
  else if (t.includes("sales") || t.includes("account executive") || t.includes("sdr") || t.includes("bdr")) baseRole = "sales";

  // 7. Marketing
  else if (t.includes("demand generation") || t.includes("performance marketing") || t.includes("paid media") || t.includes("seo") || t.includes("email marketing")) baseRole = "performance-marketer";
  else if (t.includes("brand manager") || t.includes("brand strategist") || t.includes("brand director")) baseRole = "brand-manager";
  else if (t.includes("marketing manager") || t.includes("marketing director") || t.includes("vp marketing") || t.includes("marketing") || t.includes("growth") || t.includes("social media manager")) baseRole = "marketing";

  // 8. Customer-Facing
  else if (t.includes("customer success") || t.includes("customer success manager") || t.includes("csm") || t.includes("account manager")) baseRole = "customer-success";
  else if (t.includes("customer support") || t.includes("support engineer") || t.includes("technical support") || t.includes("helpdesk")) baseRole = "support";

  // 9. Consulting / Strategy
  else if (t.includes("management consultant") || t.includes("strategy consultant") || t.includes("consultant") || t.includes("consulting") || t.includes("strategy analyst")) baseRole = "consultant";

  // 10. People / HR
  else if (t.includes("hr") || t.includes("human resources") || t.includes("people operations") || t.includes("people partner") || t.includes("compensation")) baseRole = "hr";

  // 11. Legal
  else if (t.includes("legal") || t.includes("lawyer") || t.includes("attorney") || t.includes("counsel") || t.includes("compliance") || t.includes("paralegal")) baseRole = "legal";

  // 12. Design / Creative
  else if (t.includes("product designer") || t.includes("ux designer") || t.includes("ui designer") || t.includes("designer") || t.includes("ux") || t.includes("ui") || t.includes("figma")) baseRole = "designer";
  else if (t.includes("content creator") || t.includes("content writer") || t.includes("video editor") || t.includes("copywriter")) baseRole = "content-creator";
  else if (t.includes("technical writer") || t.includes("documentation engineer") || t.includes("api writer")) baseRole = "technical-writer";
  else if (t.includes("motion designer") || t.includes("graphic designer") || t.includes("animator") || t.includes("creative director")) baseRole = "graphic-designer";

  // 13. Healthcare / Science
  else if (t.includes("healthcare analyst") || t.includes("clinical analyst") || t.includes("health informatics")) baseRole = "healthcare-analyst";
  else if (t.includes("nurse") || t.includes("physician") || t.includes("clinician") || t.includes("pharmacist") || t.includes("therapist")) baseRole = "healthcare-practitioner";
  else if (t.includes("research scientist") || t.includes("scientist") || t.includes("bioinformatics") || t.includes("chemist")) baseRole = "scientist";

  // 14. Education / Training
  else if (t.includes("teacher") || t.includes("instructor") || t.includes("professor") || t.includes("lecturer") || t.includes("trainer") || t.includes("coach")) baseRole = "educator";

  // 16. Fallback Search in Dynamic Roles
  else {
    const sortedDynamic = [...DYNAMIC_ROLES].sort((a, b) => b.length - a.length);
    for (const role of sortedDynamic) {
        if (role.length < 5) continue;
        const normRole = role.toLowerCase().replace(/-/g, " ");
        const regex = new RegExp(`\\b${normRole.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
        if (regex.test(t.replace(/-/g, " "))) {
            baseRole = role;
            break;
        }
    }
  }

  // 17. Multi-Strategy Key Search
  const spaceRole = baseRole.replace(/-/g, " ");
  const strategies = [
    `${seniority}-${baseRole}`,              // mid-software-engineer
    `mid-${baseRole}`,                      // mid-software-engineer (fallback seniority)
    baseRole,                               // software-engineer
    `${seniority} ${spaceRole}`,            // mid software engineer
    `mid ${spaceRole}`,                     // mid software engineer
    spaceRole,                              // software engineer
    `${spaceRole} ${seniority}`,            // software engineer mid
  ];

  for (const strategy of strategies) {
    if ((mvcData as any)[strategy]) return strategy;
  }

  // 18. Fuzzy Matching Fallback (Seniority-Aware)
  let bestMatch = "";
  let bestScore = 0;
  
  // Try matching WITH seniority first
  const targetWithSeniority = `${seniority} ${spaceRole}`.toLowerCase();
  
  for (const key of DYNAMIC_ROLES) {
    const keyNorm = key.toLowerCase().replace(/-/g, " ");
    
    // Exact or direct inclusion of seniority-specific role
    if (keyNorm === targetWithSeniority) return key;
    
    if (keyNorm.includes(targetWithSeniority) || targetWithSeniority.includes(keyNorm)) {
      const score = Math.min(keyNorm.length, targetWithSeniority.length) / Math.max(keyNorm.length, targetWithSeniority.length);
      // Give weight to seniority matches
      const seniorityWeight = (keyNorm.includes(seniority)) ? 1.2 : 1.0;
      const finalScore = score * seniorityWeight;
      
      if (finalScore > bestScore) {
        bestScore = finalScore;
        bestMatch = key;
      }
    }
  }

  // If no good seniority match, try base role match
  if (bestScore < 0.4) {
    const targetBase = spaceRole.toLowerCase();
    for (const key of DYNAMIC_ROLES) {
      const keyNorm = key.toLowerCase().replace(/-/g, " ");
      if (keyNorm.includes(targetBase) || targetBase.includes(keyNorm)) {
        const score = Math.min(keyNorm.length, targetBase.length) / Math.max(keyNorm.length, targetBase.length);
        if (score > bestScore) {
          bestScore = score;
          bestMatch = key;
        }
      }
    }
  }

  // Only use fuzzy match if it's reasonably similar (> 35% overlap)
  if (bestScore > 0.35) return bestMatch;

  // 19. Final safety net: Software Engineer
  const finalFallback = `${seniority}-software-engineer`;
  if ((mvcData as any)[finalFallback]) return finalFallback;
  return (mvcData as any)["mid-software-engineer"] ? "mid-software-engineer" : DYNAMIC_ROLES[0];
}

/**
 * Instantly get the standard skills for a role based on JD text,
 * bypassing the need for AI extraction. Returns the top 15-20 skills.
 */
export function getRoleStandardSkills(jdText: string): string[] {
  const roleCategory = detectRoleCategory(jdText);
  const roleData = (mvcData as any)[roleCategory] || (mvcData as any)["mid-software-engineer"];
  
  if (!roleData) return [];
  
  const skills = Array.isArray(roleData) ? roleData : (roleData.skills || []);
  return skills.map((entry: any) => entry.skill);
}

/**
 * Extract skills from text using keyword matching.
 * Uses word boundary regex for accuracy.
 * Dynamically builds the skill list from the MVC dataset.
 */
// ---------------------------------------------------------------------------
// Module-level: build skill dictionary ONCE at startup, not per request.
// ---------------------------------------------------------------------------
const UNIVERSAL_TECH = [
  "python", "javascript", "typescript", "java", "c#", "c++", "ruby", "php", "swift", "kotlin", "go", "rust", "scala", "clojure", "dart",
  "react", "angular", "vue", "next.js", "nuxt", "svelte", "jquery", "bootstrap", "tailwind", "sass", "less", "webpack", "vite",
  "node.js", "express", "django", "flask", "spring boot", "asp.net", "laravel", "ruby on rails", "fastapi", "nestjs",
  "sql", "postgresql", "mysql", "mongodb", "redis", "elasticsearch", "cassandra", "dynamodb", "firebase", "supabase", "snowflake", "bigquery",
  "aws", "azure", "gcp", "google cloud", "docker", "kubernetes", "terraform", "ansible", "jenkins", "gitlab ci", "github actions", "ci/cd",
  "machine learning", "deep learning", "nlp", "computer vision", "tensorflow", "pytorch", "scikit-learn", "keras", "pandas", "numpy", "matplotlib",
  "git", "linux", "bash", "powershell", "microservices", "rest api", "graphql", "grpc", "websockets", "agile", "scrum", "kanban", "jira",
  "unit testing", "jest", "cypress", "selenium", "playwright", "figma", "sketch", "adobe xd", "ui design", "ux design",
  "blockchain", "solidity", "web3", "smart contracts", "cybersecurity", "penetration testing", "firewalls", "siem",
  "tableau", "power bi", "looker", "etl", "data pipeline", "airflow", "kafka", "spark", "hadoop", "dbt", "llm", "openai", "gpt", "rag", "langchain"
];

/** Compiled once at module load — never rebuilt per request. */
const ALL_KNOWN_SKILLS: Map<string, RegExp> = (() => {
  const map = new Map<string, RegExp>();

  const addSkill = (skill: string) => {
    const s = skill.toLowerCase();
    if (s.length < 2 || map.has(s)) return;
    const escaped = s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = (s.includes(" ") || s.includes(".") || s.includes("-") || s.includes("#") || s.includes("+"))
      ? new RegExp(`(?<=\\s|^|[\\(\\),;])${escaped}(?=\\s|$|[\\(\\),;])`, 'i')
      : new RegExp(`\\b${escaped}\\b`, 'i');
    map.set(s, regex);
  };

  Object.values(mvcProfiles).forEach(roleData => {
    const skills = Array.isArray(roleData) ? roleData : (roleData?.skills ?? []);
    skills.forEach((s: any) => addSkill(s.skill));
  });

  UNIVERSAL_TECH.forEach(addSkill);

  const trendSkills = (skillTrends as any).skills || {};
  Object.keys(trendSkills).forEach(addSkill);

  return map;
})();

export function extractSkills(text: string): string[] {
  const found: string[] = [];
  for (const [skill, regex] of ALL_KNOWN_SKILLS) {
    if (regex.test(text)) found.push(skill);
  }
  return found;
}

/**
 * Given the user's missing skills, return the top 4-5 "must have" skills
 * and the required degree for the role.
 */
export function getMVCProfile(
  missingSkills: string[],
  jdText: string
): { mvcSkills: string[]; roleCategory: string; requiredDegree?: string } {
  const roleCategory = detectRoleCategory(jdText);
  const roleData = mvcProfiles[roleCategory] ?? mvcProfiles["other"];

  const skills = Array.isArray(roleData) ? roleData : (roleData?.skills ?? []);
  const requiredDegree = Array.isArray(roleData) ? undefined : roleData?.required_degree;

  const topSkills = skills.map((entry) => entry.skill.toLowerCase());
  const missingNorm = missingSkills.map((s) => s.toLowerCase());
  const mvcHits = missingNorm.filter((s) => topSkills.includes(s));

  if (mvcHits.length < 2) {
    return {
      mvcSkills: skills.slice(0, 20).map((e) => e.skill),
      roleCategory,
      requiredDegree,
    };
  }

  return {
    mvcSkills: mvcHits.slice(0, 20),
    roleCategory,
    requiredDegree,
  };
}

/**
 * Rank skill gaps locally using MVC model frequency data.
 */
export function rankGapsLocally(
  missingSkills: string[],
  mvcSkills: string[],
  companyType: string,
  roleCategory: string
): SkillGap[] {
  const roleData = (mvcData as any)[roleCategory] || (mvcData as any)["mid-software-engineer"];
  const skills = Array.isArray(roleData) ? roleData : (roleData?.skills ?? []);
  const mvcSet = new Set(mvcSkills.map(s => s.toLowerCase()));
  const metaMap: Record<string, any> = {};
  skills.forEach((s: any) => {
    metaMap[s.skill.toLowerCase()] = s;
  });

  // Get the max frequency in this role to use as a dynamic denominator baseline
  // We'll estimate the total samples in the model by looking at the top skill's count.
  const maxFreq = Math.max(...skills.map((s: any) => s.count || 1), 100);
  // Estimate total records: top skill (like SQL) usually has 25% - 40% frequency.
  const estimatedTotal = maxFreq * 2.5; 

  return missingSkills.map((skill, index) => {
    const sNorm = skill.toLowerCase();
    const isMvc = mvcSet.has(sNorm);
    const meta = metaMap[sNorm] || { count: 0, premium: 0, trend: {} };

    let weeks = 2;
    if (["python", "java", "c++", "c#", "rust", "go", "machine learning", "deep learning", "kubernetes", "terraform"].includes(sNorm)) {
      weeks = 4;
    } else if (["react", "angular", "vue", "typescript", "docker", "aws", "azure"].includes(sNorm)) {
      weeks = 3;
    } else if (["git", "agile", "html", "css"].includes(sNorm)) {
      weeks = 1;
    }

    const freqPercent = Math.round((meta.count / estimatedTotal) * 100);
    
    let reason = `${skill} is a relevant skill for this career path.`;
    // Only call it "Core MVC" if it has real frequency > 2%
    const isStatisticallySignificant = freqPercent >= 3;

    if (isMvc && isStatisticallySignificant) {
      reason = `${skill} is a core "Minimum Viable Candidate" skill (found in ${freqPercent}% of JDs).`;
    } else if (meta.premium > 10000) {
      reason = `${skill} is a high-ROI premium skill that can boost your salary potential.`;
    }

    return {
      skill,
      priority: isMvc ? 1 : 2,
      frequency: meta.count,
      premium: meta.premium,
      trend: meta.trend,
      weeks_to_learn: weeks,
      reason,
      in_mvc: isMvc && isStatisticallySignificant,
    };
  })
    .sort((a, b) => {
      // 1. MVC Skills with real frequency first
      if (a.in_mvc && !b.in_mvc) return -1;
      if (!a.in_mvc && b.in_mvc) return 1;
      
      // 2. Sort by frequency first (Market Demand)
      if (a.frequency !== b.frequency) return b.frequency - a.frequency;
      
      // 3. Then sort by Premium (Salary ROI)
      if (a.premium !== b.premium) return (b.premium || 0) - (a.premium || 0);
      
      return 0;
    })
    .map((gap, i) => ({ ...gap, priority: i + 1 }));
}

/**
 * Predict the next step in the career path and calculate the jump.
 */
/**
 * Predict the next step in the career path and provide the full path context.
 */
export function getTrajectoryInfo(currentRoleKey: string) {
  let seniority = "mid";
  let baseRole = currentRoleKey;

  const levels = ["junior", "mid", "senior", "executive"];
  const parts = currentRoleKey.split("-");
  
  if (levels.includes(parts[0])) {
    seniority = parts[0];
    baseRole = parts.slice(1).join("-");
  } else {
    // Try to find if the role key contains any level words
    for (const lvl of levels) {
      if (currentRoleKey.startsWith(lvl + " ")) {
         seniority = lvl;
         baseRole = currentRoleKey.replace(lvl + " ", "").replace(/ /g, "-");
         break;
      }
    }
  }

  const full_path: any[] = [];

  levels.forEach(lvl => {
    const key = `${lvl}-${baseRole}`;
    const data = (mvcData as any)[key];
    if (data) {
      full_path.push({
        level: lvl,
        label: data.role,
        salary: data.salary_avg || 0,
        skills: data.skills.map((s: any) => s.skill)
      });
    }
  });

  const currentIdx = levels.indexOf(parts[0]);
  const nextLvl = levels[currentIdx + 1];
  const nextKey = nextLvl ? `${nextLvl}-${baseRole}` : null;
  const nextData = nextKey ? (mvcData as any)[nextKey] : null;
  const currentData = (mvcData as any)[currentRoleKey];

  if (!currentData) return null;

  let deltaSkills: string[] = [];
  if (nextData) {
    const currentSkills = new Set(currentData.skills.map((s: any) => s.skill.toLowerCase()));
    deltaSkills = nextData.skills
      .filter((s: any) => !currentSkills.has(s.skill.toLowerCase()))
      .slice(0, 5)
      .map((s: any) => s.skill);
    
    if (deltaSkills.length < 3) {
      deltaSkills = [
        ...deltaSkills,
        ...nextData.skills
          .filter((s: any) => !deltaSkills.includes(s.skill))
          .slice(0, 3 - deltaSkills.length)
          .map((s: any) => s.skill)
      ];
    }
  }

  return {
    current_level: parts[0],
    current_role_label: currentData.role,
    next_role_label: nextData?.role || null,
    salary_jump: nextData ? (nextData.salary_avg || 0) - (currentData.salary_avg || 0) : 0,
    delta_skills: deltaSkills,
    current_salary: currentData.salary_avg || 0,
    next_salary: nextData?.salary_avg || 0,
    full_path
  };
}
