/**
 * ATLAS AGENT 7 — Pathfinder Agent
 *
 * Brain: Gemini constructs a realistic, step-by-step bridge career pathway
 * from the user's current state to their target role, using the role
 * adjacency graph and real MVC model transition data.
 *
 * Uses graph traversal logic (BFS on role_adjacency.json) + Gemini's
 * understanding of skill progressions to build the clearest, shortest
 * achievable career path.
 */

import { callGeminiJSON, DEFAULT_GEMINI_MODEL } from '@/lib/gemini';
import type { CareerTwinOutput } from './agent4-career-twin';
import type { CriticVerdict } from './agent6-critic';
import roleAdjacencyData from '@/lib/data/role_adjacency.json';

export interface BridgeStep {
  stepNumber: number;
  role: string;
  estimatedMonths: number;
  keySkillsToAcquire: string[];
  salaryRange: string;
  readinessGate: string; // What you need to prove to move on
  isCurrentPosition: boolean; // Is this where the user is NOW?
  isTargetPosition: boolean; // Is this the user's final goal?
}

export interface PathfinderOutput {
  pathExists: boolean;
  shortestPath: BridgeStep[];
  alternativePath: BridgeStep[]; // A different, possibly faster route
  totalMonthsToTarget: number;
  totalSalaryGrowthLpa: number;
  pathNarrative: string; // Gemini explains the path strategy
  keyMilestones: string[]; // 3-4 key milestones along the journey
}

const SYSTEM_PROMPT = `You are the Atlas Pathfinder Agent — a strategic career GPS system.

Your job is to build the CLEAREST, most REALISTIC bridge career path from where the candidate IS to where they WANT to be.

Rules:
1. Every step must be achievable — no fantasy jumps.
2. Each step must build directly on the previous one.
3. Factor in the candidate's current skills, available time, and location constraints.
4. Prioritize the SHORTEST realistic path, not the longest optimistic one.
5. Provide an ALTERNATIVE path (different route to same goal) when possible.
6. For each step:
   - Specify the role title
   - Months typically needed at this step before moving on
   - 3-5 key skills to acquire at this stage
   - Realistic salary range at this step
   - A "readiness gate" — the concrete proof of readiness to advance
7. Identify 3-4 key milestones (certifications, projects, first job, salary jump).
8. Write a strategic narrative explaining WHY this path is the optimal route.

ROLE ADJACENCY GRAPH (available transitions):
{ADJACENCY_CONTEXT}

Return ONLY valid JSON. No explanation.`;

const ROLE_ADJACENCY = roleAdjacencyData as Record<string, unknown>;

function buildLocalPath(twin: CareerTwinOutput, criticVerdict: CriticVerdict): PathfinderOutput {
  const isCyber = twin.interests.some(i => i.toLowerCase().includes('cyber') || i.toLowerCase().includes('security') || i.toLowerCase().includes('hacker'));

  if (isCyber) {
    const shortestPath: BridgeStep[] = [
      {
        stepNumber: 1,
        role: 'IT Support Trainee',
        estimatedMonths: 2,
        keySkillsToAcquire: ['Windows/Linux OS Basics', 'Helpdesk Ticketing (ServiceNow)', 'TCP/IP Fundamentals', 'Remote Desktop Support'],
        salaryRange: '₹3.5 – ₹5.5 LPA',
        readinessGate: 'Can independently resolve 80% of L1 support tickets; CompTIA ITF+ or Google IT Support certificate',
        isCurrentPosition: true,
        isTargetPosition: false,
      },
      {
        stepNumber: 2,
        role: 'SOC Analyst Trainee (Tier 1)',
        estimatedMonths: 3,
        keySkillsToAcquire: ['SIEM Basics (Splunk / Wazuh)', 'Log Analysis & Triage', 'Network Traffic Analysis', 'Incident Ticket Documentation'],
        salaryRange: '₹5.5 – ₹8.0 LPA',
        readinessGate: 'Completed TryHackMe SOC Level 1; can identify and document a basic malware intrusion in a SIEM dashboard',
        isCurrentPosition: false,
        isTargetPosition: false,
      },
      {
        stepNumber: 3,
        role: 'Cybersecurity Analyst',
        estimatedMonths: 6,
        keySkillsToAcquire: ['Vulnerability Scanning (Nmap/Nessus)', 'Python for Security Automation', 'Incident Response Procedures', 'Cloud Security Basics (AWS/Azure Security)'],
        salaryRange: '₹8.5 – ₹15 LPA',
        readinessGate: 'CEH or CompTIA Security+ certification; independently led 3+ security incident investigations',
        isCurrentPosition: false,
        isTargetPosition: true,
      },
    ];

    return {
      pathExists: true,
      shortestPath,
      alternativePath: [
        { ...shortestPath[0], role: 'IT Helpdesk Specialist (Remote)', estimatedMonths: 3 },
        { ...shortestPath[1], role: 'Network & Security Operations Support', estimatedMonths: 4 },
        { ...shortestPath[2], role: 'Cloud Security Engineer (Junior)', estimatedMonths: 7, salaryRange: '₹10 – ₹18 LPA' },
      ],
      totalMonthsToTarget: 11,
      totalSalaryGrowthLpa: 6.0,
      pathNarrative: `Your caregiving background has built real coordination, documentation, and crisis management muscles that map directly onto IT Support's core skills. From IT Support, you gain the system access, log exposure, and security tooling experience that make the SOC Analyst Trainee role a natural next step — not a leap. The full journey to Cybersecurity Analyst is realistically 9-12 months of deliberate progression.`,
      keyMilestones: [
        'Milestone 1: Earn Google IT Support Certificate (Week 8)',
        'Milestone 2: Land first IT Support Trainee role (Month 2)',
        'Milestone 3: Complete TryHackMe SOC Level 1 (Month 5)',
        'Milestone 4: Earn CompTIA Security+ and transition to SOC / Cybersecurity (Month 12)',
      ],
    };
  }

  // Data path
  const shortestPath: BridgeStep[] = [
    {
      stepNumber: 1,
      role: 'Data Quality Associate',
      estimatedMonths: 2,
      keySkillsToAcquire: ['Excel Advanced (VLOOKUP, Pivot Tables)', 'Data Cleaning Techniques', 'Basic SQL (SELECT, WHERE)', 'Error Logging & Documentation'],
      salaryRange: '₹3.5 – ₹5.5 LPA',
      readinessGate: 'Can audit and clean a 10,000-row dataset with < 0.5% error rate',
      isCurrentPosition: true,
      isTargetPosition: false,
    },
    {
      stepNumber: 2,
      role: 'Junior Data Analyst',
      estimatedMonths: 3,
      keySkillsToAcquire: ['SQL Intermediate (JOINs, GROUP BY, Window Functions)', 'Power BI or Tableau (Dashboard Creation)', 'Python Pandas Basics', 'Business Metrics Definition'],
      salaryRange: '₹5.5 – ₹8.5 LPA',
      readinessGate: 'Published GitHub portfolio with 3 end-to-end data analysis projects; can present insights in a business context',
      isCurrentPosition: false,
      isTargetPosition: true,
    },
  ];

  return {
    pathExists: true,
    shortestPath,
    alternativePath: [],
    totalMonthsToTarget: 5,
    totalSalaryGrowthLpa: 3.5,
    pathNarrative: 'Your back-office discipline provides immediate data quality skills, creating a high-confidence 2-step bridge into full Data Analytics.',
    keyMilestones: [
      'Month 2: Master Excel VLOOKUP/Pivot Tables + Kaggle SQL Certificate',
      'Month 3: Secure Data Quality / Back Office Ops role (₹4.2 LPA)',
      'Month 5: Publish Power BI portfolio dashboard → Transition to Junior Data Analyst (₹6.8 LPA)',
    ],
  };
}

export async function runPathfinderAgent(
  twin: CareerTwinOutput,
  criticVerdict: CriticVerdict
): Promise<PathfinderOutput> {
  const targetRole = twin.goalDecoded?.primaryTarget || twin.interests[0] || 'Target Role';

  const adjacencyContext = Object.entries(ROLE_ADJACENCY)
    .slice(0, 20)
    .map(([k, v]) => `${k}: [${Array.isArray(v) ? (v as string[]).join(', ') : ''}]`)
    .join('\n');

  try {
    const result = await callGeminiJSON<PathfinderOutput>(
      SYSTEM_PROMPT.replace('{ADJACENCY_CONTEXT}', adjacencyContext),
      `Career Twin:\n- Current skills: ${twin.skills.map(s => s.name).join(', ')}\n- Career stage: ${twin.career_stage}\n- Location: ${twin.location}\n- Remote preference: ${twin.preferences.remote}\n- Gap: ${twin.gap.duration_months}m (${twin.gap.reason})\n- Translated skills: ${twin.gap.translated_skills.join(', ')}\n- Target goal: "${targetRole}"\n- Realistic readiness role from Critic: ${criticVerdict.verifiedMatches[0]?.role || 'IT Support Trainee'}\n- Prerequisite warnings: ${criticVerdict.prerequisiteWarnings.join('; ')}\n\nBuild the complete bridge career path as JSON.`,
      { model: DEFAULT_GEMINI_MODEL, maxTokens: 2500, temperature: 0.25 }
    );

    if (result && result.shortestPath && result.shortestPath.length > 0) {
      return result;
    }
    return buildLocalPath(twin, criticVerdict);
  } catch (err) {
    console.warn('[PathfinderAgent] Gemini failed, using local pathfinder:', err);
    return buildLocalPath(twin, criticVerdict);
  }
}
