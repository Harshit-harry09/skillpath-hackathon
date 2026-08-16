import { NextRequest, NextResponse } from "next/server";
import { callGemini } from "@/lib/gemini";
import { buildDigitalTwinSummary, formatCompressedContext } from "@/lib/atlas/chat-memory-compressor";
import { getAuthUserSafe } from "@/lib/auth-helpers";
import { guardAiRequest } from "@/lib/request-guard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUserSafe(req);
    const rateLimitError = guardAiRequest(req, user?.uid, user ? 30 : 5);
    if (rateLimitError) return rateLimitError;

    const body = await req.json().catch(() => ({}));
    const { messages, sessionContext } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0 || messages.length > 30) {
      return NextResponse.json({ success: false, error: "Messages array is required." }, { status: 400 });
    }

    const lastUserMessage = typeof messages[messages.length - 1]?.content === 'string'
      ? messages[messages.length - 1].content.slice(0, 4000)
      : "Hello!";
    const sessionState = sessionContext?.sessionState || {};
    const digitalTwinSummary = buildDigitalTwinSummary(sessionState);

    // Detect agent execution command intent
    let actionCommand: any = null;
    const lowerMsg = lastUserMessage.toLowerCase();

    const matchHours = lowerMsg.match(/\b(\d{1,2})\s*(?:hours|hrs|hr|h)\b/i) || lowerMsg.match(/(\d{1,2})/);

    if (lowerMsg.includes("employer readiness") || lowerMsg.includes("ats score") || lowerMsg.includes("agent 14") || lowerMsg.includes("readiness") || lowerMsg.includes("employer audit")) {
      actionCommand = {
        type: "EXECUTE_AGENT",
        agentId: "agent14_employer_readiness",
        agentName: "Agent 14: Employer Readiness",
        params: { customCriteria: lastUserMessage },
      };
    } else if (lowerMsg.includes("roadmap") || lowerMsg.includes("hours") || lowerMsg.includes("agent 8") || lowerMsg.includes("rebuild") || lowerMsg.includes("curriculum")) {
      const hours = matchHours ? parseInt(matchHours[1]) : 20;
      actionCommand = {
        type: "EXECUTE_AGENT",
        agentId: "agent8_roadmap",
        agentName: "Agent 8: Learning Roadmap",
        params: { hoursPerWeek: hours, customCriteria: lastUserMessage },
      };
    } else if (lowerMsg.includes("recalibrate") || lowerMsg.includes("role matches") || lowerMsg.includes("agent 5 font-bold") || lowerMsg.includes("agent 5") || lowerMsg.includes("roles") || lowerMsg.includes("cybersecurity") || lowerMsg.includes("data analyst") || lowerMsg.includes("developer")) {
      let targetGoal: string | undefined = undefined;
      if (lowerMsg.includes("cybersecurity")) targetGoal = "Cybersecurity Specialist";
      else if (lowerMsg.includes("data")) targetGoal = "Data Analyst / Data Engineer";
      else if (lowerMsg.includes("developer") || lowerMsg.includes("software")) targetGoal = "Full Stack Software Engineer";

      actionCommand = {
        type: "EXECUTE_AGENT",
        agentId: "agent5_matcher",
        agentName: "Agent 5: Opportunity Matcher",
        params: { targetGoal, customCriteria: lastUserMessage },
      };
    } else if (lowerMsg.includes("inclusion") || lowerMsg.includes("fairness") || lowerMsg.includes("agent 9") || lowerMsg.includes("bias") || lowerMsg.includes("immunity")) {
      actionCommand = {
        type: "EXECUTE_AGENT",
        agentId: "agent9_inclusion",
        agentName: "Agent 9: Bias & Fairness Auditor",
        params: { customCriteria: lastUserMessage },
      };
    } else if (lowerMsg.includes("simulator") || lowerMsg.includes("agent 10") || lowerMsg.includes("future")) {
      actionCommand = {
        type: "EXECUTE_AGENT",
        agentId: "agent10_simulator",
        agentName: "Agent 10: Future Simulator",
        params: { hoursPerWeek: 15 },
      };
    } else if (lowerMsg.includes("rerun full swarm") || lowerMsg.includes("full pipeline") || lowerMsg.includes("rerun all") || lowerMsg.includes("update all")) {
      actionCommand = {
        type: "EXECUTE_AGENT",
        agentId: "full_swarm",
        agentName: "Complete 14-Agent Swarm Pipeline",
        params: {},
      };
    }

    const compressedContextStr = formatCompressedContext(digitalTwinSummary);

    const systemPrompt = `You are Atlas Career Copilot & Mentor inside the SkillPath Atlas Swarm.

${compressedContextStr}

CONSTRUCTIVE REALITY & EMPATHETIC MENTOR RULES:
1. If the candidate asks to recalculate/rerun an agent, confirm you are executing the command.
2. Provide grounded, high-trust, constructive evaluation.
3. Keep responses structured with bullet points.`;

    try {
      const aiResponse = await callGemini(systemPrompt, lastUserMessage, {
        model: "gemini-3.5-flash-lite",
        temperature: 0.3,
        maxTokens: 1024,
        agentGroup: "synthesis",
      });

      if (aiResponse && aiResponse.trim().length > 0) {
        return NextResponse.json({
          success: true,
          reply: aiResponse,
          actionCommand,
        });
      }
    } catch (llmErr) {
      console.warn("[Atlas Chat API] LLM call fallback triggered:", llmErr);
    }

    let fallbackReply = "";
    if (actionCommand) {
      fallbackReply = `### ⚡ COMMAND EXECUTED: ${actionCommand.agentName.toUpperCase()}\n\n` +
        `* **Status:** Dispatched re-execution for **${actionCommand.agentName}**.\n` +
        `* **Action:** Recalculating metrics and updating your live dashboard in real-time.`;
    } else {
      fallbackReply = `### 💡 ATLAS CAREER COPILOT FOR ${digitalTwinSummary.name.toUpperCase()}\n\n` +
        `I am here to give you **honest, clear reality checks** combined with an **actionable path forward**.\n\n` +
        `* Tell me: *"Recalculate Employer Readiness"* to re-run Agent 14.\n` +
        `* Tell me: *"Rebuild roadmap for 20 hours a week"* to re-run Agent 8.\n` +
        `* Tell me: *"Recalibrate role matches"* to re-run Agent 5.`;
    }

    return NextResponse.json({
      success: true,
      reply: fallbackReply,
      actionCommand,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Chat processing failed.";
    console.error("Atlas Chat API error:", error);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
