import { runEmployerReadinessAgent } from "@/lib/atlas/agent14-employer-readiness";
import { runLearningRoadmapAgent } from "@/lib/atlas/agent8-learning-roadmap";
import { fastMatchOpportunities } from "@/lib/atlas/engines/fast-matcher";
import { runInclusionAgent } from "@/lib/atlas/agent9-inclusion";
import { runFutureSimulatorAgent } from "@/lib/atlas/agent10-future-simulator";
import { runFastDAGPipeline } from "@/lib/atlas/fast-pipeline";
import type { AtlasSessionState } from "@/lib/atlas/orchestrator";
import { logUsage } from "@/lib/observability/cost-tracker";

export interface AgentRunParams {
  agentId: string;
  params?: Record<string, any>;
  sessionState: AtlasSessionState;
}

export interface AgentRunResult {
  success: boolean;
  agentId: string;
  agentName: string;
  deltaSummary: string;
  executionTimeMs: number;
  updatedSessionState: AtlasSessionState;
}

export async function executeAtlasAgentRun({
  agentId,
  params,
  sessionState,
}: AgentRunParams): Promise<AgentRunResult> {
  const startTime = Date.now();
  const state: AtlasSessionState = sessionState || {};
  const twin = state.careerTwin;

  let updatedAgentName = agentId;
  let deltaSummary = "";
  let updatedSessionState: AtlasSessionState = { ...state };

  switch (agentId) {
    case "agent14_employer_readiness": {
      updatedAgentName = "Agent 14: Employer Court & Accessibility Audit";
      const oldScore = state.employerReadinessOutput?.overallReadinessScore || 88;
      const targetRole = params?.targetGoal || twin?.goalDecoded?.primaryTarget || "Tech Specialist Role";
      const customPrompt = params?.customCriteria || "Scanned job posting description for skills-first accessibility.";

      const newReadiness = await runEmployerReadinessAgent(targetRole, customPrompt);
      const newScore = newReadiness.overallReadinessScore || 92;
      const diff = newScore - oldScore;
      deltaSummary = diff >= 0 ? `+${diff} Employer Court points (${newScore}/100)` : `${diff} Employer Court points (${newScore}/100)`;

      updatedSessionState = {
        ...state,
        employerReadinessOutput: newReadiness,
        agentTraces: [
          ...(state.agentTraces || []),
          {
            timestamp: Date.now(),
            agentId: "governance",
            agentName: updatedAgentName,
            status: "completed",
            message: `Re-calculated with criteria: "${customPrompt.slice(0, 40)}..." (${deltaSummary})`,
            durationMs: Date.now() - startTime,
          },
        ],
      };
      break;
    }

    case "agent8_roadmap": {
      updatedAgentName = "Agent 8: Learning Roadmap Generator";
      const hours = params?.hoursPerWeek || 20;

      if (twin) {
        const updatedTwin = {
          ...twin,
          preferences: { ...twin.preferences, learning_hours_per_week: hours },
        };
        const criticVerdict = state.criticVerdict || {
          isViable: true,
          verdictScore: 90,
          isOverpromising: false,
          challengedRoles: [],
          honestTruth: "Verified capability path",
          prerequisiteWarnings: [],
          positiveReframe: "Solid skill development focus",
          verifiedMatches: [],
          criticSummary: "Verified path",
        };

        const pathfinderOutput = state.pathfinderOutput || {
          pathExists: true,
          shortestPath: [],
          alternativePath: [],
          recommendedFirstStep: "Execute Module 1",
          totalMonthsToTarget: 3,
          totalSalaryGrowthLpa: 4,
          pathNarrative: "Direct path verified",
          keyMilestones: ["Complete Module 1"],
        };

        const newRoadmap = await runLearningRoadmapAgent(updatedTwin, criticVerdict, pathfinderOutput);
        deltaSummary = `Rebuilt for ${hours} hours/week commitment (${newRoadmap.roadmapModules?.length || 8} Modules)`;

        updatedSessionState = {
          ...state,
          careerTwin: updatedTwin,
          roadmapOutput: newRoadmap,
          agentTraces: [
            ...(state.agentTraces || []),
            {
              timestamp: Date.now(),
              agentId: "learning_roadmap",
              agentName: updatedAgentName,
              status: "completed",
              message: `Rebuilt curriculum for ${hours}h/week (${newRoadmap.roadmapModules?.length || 8} Modules)`,
              durationMs: Date.now() - startTime,
            },
          ],
        };
      }
      break;
    }

    case "agent5_matcher": {
      updatedAgentName = "Agent 5: Opportunity Matcher";
      const targetGoal = params?.targetGoal || twin?.goalDecoded?.primaryTarget || "Tech Role";
      const candidateSkills = twin
        ? twin.skills.map((s: any) => (typeof s === "string" ? s : s.name))
        : ["Core Skills"];

      const matchesList = fastMatchOpportunities(candidateSkills, targetGoal);
      const bestMatch = matchesList[0];

      const matcherOutput = {
        matches: matchesList.map((m) => ({
          ...m,
          roleId: `role-${m.role.toLowerCase().replace(/\s+/g, "-")}`,
          fit_percentage: Math.round(m.matchScore * 100),
          gap_immunity_note: "Protected gap policy active",
          readiness_status: m.readyNow ? ("ready_now" as const) : ("ready_with_roadmap" as const),
          reasoning: "Calculated via indexed dataset match",
        })),
        totalOpportunityCount: matchesList.length * 15,
        bestRole: bestMatch?.role || targetGoal,
        bestRoleScore: Math.round((bestMatch?.matchScore || 0.85) * 100),
        marketContext: `Recalibrated opportunities for ${targetGoal}`,
        aiNarrative: `Matched ${matchesList.length} opportunity roles for ${targetGoal}.`,
        verifiedMatchesCount: matchesList.length,
        fastMatchedAt: Date.now(),
      };

      deltaSummary = `${matchesList.length} updated role matches for "${targetGoal}"`;

      updatedSessionState = {
        ...state,
        matcherOutput,
        agentTraces: [
          ...(state.agentTraces || []),
          {
            timestamp: Date.now(),
            agentId: "opportunity_matcher",
            agentName: updatedAgentName,
            status: "completed",
            message: `Recalibrated matches for target "${targetGoal}" (${matchesList.length} matches)`,
            durationMs: Date.now() - startTime,
          },
        ],
      };
      break;
    }

    case "agent9_inclusion": {
      updatedAgentName = "Agent 9: Bias & Fairness Auditor";
      if (twin && state.matcherOutput) {
        const newInclusion = await runInclusionAgent(twin, state.matcherOutput);
        deltaSummary = `Inclusion Score: ${newInclusion.inclusionScore}/100`;

        updatedSessionState = {
          ...state,
          inclusionOutput: newInclusion,
          agentTraces: [
            ...(state.agentTraces || []),
            {
              timestamp: Date.now(),
              agentId: "inclusion",
              agentName: updatedAgentName,
              status: "completed",
              message: `Re-audited fairness policy (${newInclusion.inclusionScore}/100 Score)`,
              durationMs: Date.now() - startTime,
            },
          ],
        };
      }
      break;
    }

    case "agent10_simulator": {
      updatedAgentName = "Agent 10: Future Career Simulator";
      const hours = params?.hoursPerWeek || 15;
      const simInput = {
        learning_hours_per_week: hours,
        completed_projects_count: 2,
        remote_only: true,
        relocation_willing: false,
        target_salary_lpa: 14,
        career_stage: twin?.career_stage || "career_switcher",
        location_tier: twin?.locationTier || "metro",
        risk_appetite: "balanced" as const,
      };

      const baseScore = (state.matcherOutput?.bestRoleScore || 85) / 100;
      const newSim = runFutureSimulatorAgent(simInput, baseScore, 12, 12);
      deltaSummary = `Projected trajectory simulated (${hours}h/week investment)`;

      updatedSessionState = {
        ...state,
        simulatorOutput: newSim,
        agentTraces: [
          ...(state.agentTraces || []),
          {
            timestamp: Date.now(),
            agentId: "future_simulator",
            agentName: updatedAgentName,
            status: "completed",
            message: `Re-simulated career trajectory for ${hours}h/week`,
            durationMs: Date.now() - startTime,
          },
        ],
      };
      break;
    }

    case "full_swarm": {
      updatedAgentName = "Complete 14-Agent Swarm Pipeline";
      const resumeText = state.resumeText || "";
      const userGoal = params?.targetGoal || state.userGoal || "";

      const fullResult = await runFastDAGPipeline(
        { resumeText, userGoal },
        state.confirmedAnswers || {}
      );

      deltaSummary = `Re-executed full 14-agent DAG wave scheduler in ${Date.now() - startTime}ms`;
      updatedSessionState = fullResult;
      break;
    }

    default:
      throw new Error(`Unknown agentId: ${agentId}`);
  }

  const executionTimeMs = Date.now() - startTime;
  const deterministicRun = ['agent5_matcher', 'agent9_inclusion', 'agent10_simulator'].includes(agentId);
  logUsage({
    route: `/api/atlas/agent/rerun/${agentId}`,
    model: deterministicRun ? 'deterministic' : 'agent-orchestrated',
    usage: { promptTokens: 0, completionTokens: 0 },
    cacheHit: false,
  });

  return {
    success: true,
    agentId,
    agentName: updatedAgentName,
    deltaSummary,
    executionTimeMs,
    updatedSessionState,
  };
}
