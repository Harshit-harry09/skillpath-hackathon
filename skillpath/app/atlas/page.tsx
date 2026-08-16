'use client';

import React, { Suspense, useState, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { wrap } from 'comlink';
import type { pdfParserWorker } from '@/lib/workers/pdf-parser.worker';
import {
  ShieldCheck,
  Compass,
  Zap,
  CheckCircle2,
  AlertTriangle,
  FileText,
  UserCheck,
  Layers,
  RotateCcw,
  Sliders,
  MapPin,
  Heart,
  Check,
  ExternalLink,
  GitCompare,
  Upload,
  ArrowRight,
  BookOpen,
  Sparkles,
  HelpCircle,
  Briefcase,
  Copy,
  Target,
  MessageSquare,
  Bot,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import AtlasCopilotChat from '@/components/atlas/AtlasCopilotChat';
import type { AtlasSessionState } from '@/lib/atlas/orchestrator';
import type { AtlasDoubtQuestion } from '@/types/atlas';
import type { RoleSwitchComparisonOutput } from '@/lib/atlas/agent12-role-switch-comparison';
import type { ExclusionaryTerm, HrAccommodationAction } from '@/lib/atlas/agent14-employer-readiness';
import NeuralBackground from '@/components/ui/flow-field-background';
import { featureFlags } from '@/lib/feature-flags';
import { CareerTwinDNA } from '@/components/atlas/CareerTwinDNA';
import { GapAlchemy } from '@/components/atlas/GapAlchemy';
import { BridgeRoleLadder } from '@/components/atlas/BridgeRoleLadder';
import { FutureProofRadar } from '@/components/atlas/FutureProofRadar';
import { InterviewDojo } from '@/components/atlas/InterviewDojo';
import { SalaryWarRoom } from '@/components/atlas/SalaryWarRoom';
import { HiddenDoorNetwork } from '@/components/atlas/HiddenDoorNetwork';
import { EmployerCourt } from '@/components/atlas/EmployerCourt';
import { ShadowBoard } from '@/components/atlas/ShadowBoard';
import { SapHubExportModal } from '@/components/atlas/SapHubExportModal';
import { FairnessCertificateModal } from '@/components/atlas/FairnessCertificateModal';
import { Database, Award } from 'lucide-react';

// 4 Interactive Hackathon Theme Presets for 1-Click Evaluation
const DEMO_PRESETS = [
  {
    id: 'caregiving_cyber',
    label: '🌟 Caregiving Break ➔ Remote Cybersecurity',
    tag: 'Women Returner • Gap Immunity • Lived Experience',
    icon: '🌟',
    resume: `EXPERIENCE:
2018 - 2021: Back Office Operations & Data Entry Associate, Apex Solutions, Lucknow. Managed customer databases, Excel logs, customer queries, vendor scheduling, and daily KPI reporting.
2021 - 2024: 3-Year Career Pause for Family Elder Care. Managed complex medical schedules, multi-family care logistics, household budgeting, and crisis coordination under tight constraints.

SKILLS:
Excel (VLOOKUP, Pivot Tables), Data Validation, Process Scheduling, Computer Basics, Verbal & Written Communication, Stakeholder Organization, Multi-Tasking.

EDUCATION:
B.A. General (2018), Lucknow University.`,
    goal: 'I took a 3-year gap for family caregiving and want to transition into a remote IT Support, SOC Analyst, or Cybersecurity role.',
  },
  {
    id: 'first_gen_rural',
    label: '🚀 First-Gen Tier-2/3 Graduate ➔ Junior Full Stack',
    tag: 'Tier-2/3 Candidate • First-Gen Support • Remote',
    icon: '🚀',
    resume: `EXPERIENCE:
2023 - 2024: Volunteer Computer Lab Assistant, Government College, Gorakhpur. Configured Windows & Linux systems, guided 150+ students on basic internet setup, and resolved software installation issues.
Academic Projects: Built responsive College Library portal using HTML, CSS, JavaScript, and MySQL.

SKILLS:
JavaScript, React Basics, HTML5, CSS3, SQL Queries, Linux Terminal, Hardware Diagnostics, Fluent Hindi & English.

EDUCATION:
B.Tech Computer Science (2024), Tier-3 Regional Engineering College, Gorakhpur. (First in family to attend college).`,
    goal: 'First-generation graduate from Gorakhpur looking for entry-level Junior Full Stack Developer or Web Support roles.',
  },
  {
    id: 'displaced_data',
    label: '⚡ Automation Displacement ➔ AI Ops & QA Pathway',
    tag: 'Displaced Worker • 8-Wk Bridge Ladder • Reskilling',
    icon: '⚡',
    resume: `EXPERIENCE:
2019 - 2024: Transactional Data & Billing Associate, Regional Services Center, Bhopal. Processed 500+ daily invoice entries, verified GST ledger compliance, and rectified logistics anomalies. (Role phased out due to robotic process automation / AI transcription).

SKILLS:
High-Volume Data Entry (70 wpm), Excel Advanced, ERP Data Entry, Data Cleansing, Exception Handling, Quality Assurance basics.

EDUCATION:
B.Com (2019), Barkatullah University, Bhopal.`,
    goal: 'My transactional processing role was automated by AI. I need an actionable reskilling pathway to QA Automation or AI Data Operations.',
  },
  {
    id: 'pwd_remote_tech',
    label: '♿ PwD Accessibility Candidate ➔ Async Cloud Support',
    tag: 'Accessibility Accommodations • Remote-First • Skills Blind',
    icon: '♿',
    resume: `EXPERIENCE:
2022 - 2024: Freelance Remote Technical Writer & QA Tester. Documented REST API endpoints, tested web applications using NVDA & JAWS screen readers, and logged accessibility bug reports in GitHub Issues.

SKILLS:
Screen Reader Testing (NVDA/JAWS), Web Accessibility (WCAG 2.1), Python Scripting Basics, Git & GitHub, Markdown, Customer Support Ticketing.

ACCESSIBILITY ACCOMMODATIONS:
Visual impairment requiring screen-reader compatible toolchains and asynchronous remote work schedule.

EDUCATION:
BCA (2022), Distance Learning, IGNOU.`,
    goal: 'Seeking remote IT Support, Cloud QA, or Technical Documentation roles with screen-reader accessibility and flexible hours.',
  },
];

export default function AtlasMissionControlPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-surface-base" aria-label="Loading Atlas" />}>
      <AtlasMissionControlContent />
    </Suspense>
  );
}

function AtlasMissionControlContent() {
  const searchParams = useSearchParams();
  const analysisId = searchParams.get('analysisId');
  const mode = searchParams.get('mode') === 'funnel' ? 'funnel' : 'direct';
  const [mounted, setMounted] = React.useState(false);
  const { theme } = useTheme();

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted && theme === 'dark';
  const particleColor = isDark ? '#ff4d8b' : '#ff4d8b';
  const trailColor = isDark ? '5, 5, 5' : '255, 250, 240';

  // Step state: 1 = Input Profile, 2 = Agent Check / Multi-Question Intake, 3 = Dashboard Results
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // A funnel launch must not carry demo text into the imported analysis.
  const [resumeText, setResumeText] = useState(() => analysisId ? '' : DEMO_PRESETS[0].resume);
  const [userGoal, setUserGoal] = useState('');
  const [loading, setLoading] = useState(false);
  const [atlasError, setAtlasError] = useState<string | null>(null);
  const [sessionState, setSessionState] = useState<AtlasSessionState | null>(null);
  const [confirmedAnswers, setConfirmedAnswers] = useState<Record<string, string>>({});
  
  // Interactive Questions state (Step 2)
  const [questionsList, setQuestionsList] = useState<AtlasDoubtQuestion[]>([]);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);

  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [pdfBase64, setPdfBase64] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'briefing' | 'strategy' | 'twin' | 'matches' | 'roadmap' | 'fairness' | 'readiness' | 'copilot' | 'traces'>('briefing');
  const [copiedBulletIdx, setCopiedBulletIdx] = useState<number | null>(null);
  const [showTextPaste, setShowTextPaste] = useState(false);
  const [showFloatingChat, setShowFloatingChat] = useState(false);

  // Future Simulator State
  const [simHours, setSimHours] = useState(12);
  const [simProjects, setSimProjects] = useState(2);

  // Role Switch Comparison Modal State
  const [compareRoleTarget, setCompareRoleTarget] = useState<string | null>(null);
  const [comparisonData, setComparisonData] = useState<RoleSwitchComparisonOutput | null>(null);
  const [comparingLoading, setComparingLoading] = useState(false);

  // Live Agent Notification Toast State
  const [agentNotification, setAgentNotification] = useState<string | null>(null);

  // SAP Talent Intelligence Hub & Fairness Modal States
  const [showSapExportModal, setShowSapExportModal] = useState(false);
  const [showFairnessModal, setShowFairnessModal] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Run Atlas Pipeline
  const startAtlasExploration = async (overrideAnalysisId?: string | unknown) => {
    const validAnalysisId = typeof overrideAnalysisId === 'string' ? overrideAnalysisId : analysisId || undefined;
    setLoading(true);
    setAtlasError(null);
    setStep(2);
    // Clear old confirmed answers for new exploration
    const currentConfirmed = {};
    setConfirmedAnswers({});
    try {
      const res = await fetch('/api/atlas/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          analysisId: validAnalysisId,
          mode,
          resumeText,
          pdfBase64,
          userGoal,
          confirmedAnswers: currentConfirmed,
        }),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success || !json.data) {
        throw new Error(json.error || 'Atlas could not start this exploration.');
      }
      if (json.extractedResumeText && json.extractedResumeText.length > 50) {
        setResumeText(json.extractedResumeText);
      }
      const state: AtlasSessionState = json.data;
      setSessionState(state);

      // Check if Doubt Resolver generated questions
      const questions = state.doubtOutput?.questions || [];
      if (questions.length > 0) {
        setQuestionsList(questions);
        setCurrentQuestionIdx(0);
        // Set initial default selections
        const initialAnswers: Record<string, string> = {};
        questions.forEach(q => {
          initialAnswers[q.id] = q.detectedValue || q.options[0];
        });
        setConfirmedAnswers(initialAnswers);
      } else {
        setStep(3); // Advance directly to results
      }
    } catch (err) {
      console.error('Failed to run Atlas Orchestrator:', err);
      setAtlasError(err instanceof Error ? err.message : 'Atlas could not start this exploration.');
      setStep(1);
    } finally {
      setLoading(false);
    }
  };

  // Submit Interactive Answers and Continue to Results
  const handleConfirmAllAnswersAndContinue = async () => {
    let completed = false;
    setLoading(true);
    setAtlasError(null);
    try {
      const res = await fetch('/api/atlas/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resumeText,
          pdfBase64,
          userGoal,
          analysisId: analysisId || undefined,
          mode,
          confirmedAnswers,
        }),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success || !json.data) {
        throw new Error(json.error || 'Atlas could not update this exploration.');
      }
      setSessionState(json.data);
      completed = true;
    } catch (err) {
      console.error('Doubt confirmation error:', err);
      setAtlasError(err instanceof Error ? err.message : 'Atlas could not update this exploration.');
    } finally {
      setLoading(false);
      if (completed) setStep(3);
    }
  };

  // File Upload (.txt, .md, .docx, .pdf text)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedFileName(file.name);

    if (file.name.toLowerCase().endsWith('.pdf') || file.type === 'application/pdf') {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64 = event.target?.result as string;
        if (base64) {
          setPdfBase64(base64);
          const worker = new Worker(new URL('../../lib/workers/pdf-parser.worker.ts', import.meta.url));
          const parser = wrap<typeof pdfParserWorker>(worker);
          void parser.parsePdf(await file.arrayBuffer()).then((preview) => {
            if (preview.text.length > 30) setResumeText(preview.text);
            else setResumeText(`[Uploaded PDF Resume: ${file.name} - server extraction ready]`);
          }).catch(() => {
            setResumeText(`[Uploaded PDF Resume: ${file.name} - server extraction ready]`);
          }).finally(() => worker.terminate());
        }
      };
      reader.readAsDataURL(file);
    } else {
      setPdfBase64(null);
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        if (content) {
          setResumeText(content);
        }
      };
      reader.readAsText(file);
    }
  };

  // Role Switch Comparison Modal
  const handleCompareRole = async (targetRole: string) => {
    setCompareRoleTarget(targetRole);
    setComparingLoading(true);
    setComparisonData(null);
    try {
      const res = await fetch('/api/atlas/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentSkills: sessionState?.careerTwin?.skills?.map((s) => s.name) || [],
          targetRole,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success || !json.data) {
        throw new Error(json.error || 'Atlas could not compare these roles.');
      }
      setComparisonData(json.data);
    } catch (err) {
      console.error('Role comparison failed:', err);
      setAgentNotification(err instanceof Error ? err.message : 'Atlas could not compare these roles.');
    } finally {
      setComparingLoading(false);
    }
  };

  const copyToClipboard = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedBulletIdx(idx);
    setTimeout(() => setCopiedBulletIdx(null), 2000);
  };

  const handleExecuteAgentCommand = async (command: { agentId: string; params?: any }) => {
    try {
      const res = await fetch('/api/atlas/agent/rerun', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId: command.agentId,
          params: command.params,
          sessionState,
        }),
      });

      const data = await res.json();
      if (data.success && data.updatedSessionState) {
        setSessionState(data.updatedSessionState);

        // Auto-switch to the relevant tab so the user sees the result page change live!
        const agentId = command.agentId;
        let targetTab: typeof activeTab = 'briefing';
        if (agentId === 'agent14_employer_readiness') targetTab = 'readiness';
        else if (agentId === 'agent8_roadmap') targetTab = 'roadmap';
        else if (agentId === 'agent5_matcher') targetTab = 'matches';
        else if (agentId === 'agent9_inclusion') targetTab = 'fairness';
        else if (agentId === 'agent10_simulator') targetTab = 'briefing';

        setActiveTab(targetTab);

        // Trigger visual toast notice
        const notice = `⚡ ${data.agentName || 'Agent Execution'} Completed: Results updated live on your dashboard!`;
        setAgentNotification(notice);
        setTimeout(() => setAgentNotification(null), 6000);

        return {
          success: true,
          agentName: data.agentName,
          deltaSummary: data.deltaSummary,
          updatedSessionState: data.updatedSessionState,
        };
      }
      return { success: false };
    } catch (err) {
      console.error('Failed to execute agent command:', err);
      return { success: false };
    }
  };

  // Extract Session Data
  const twin = sessionState?.careerTwin;
  const matcher = sessionState?.matcherOutput;
  const verifiedMatches = sessionState?.criticVerdict?.verifiedMatches || matcher?.matches || [];
  const pathfinder = sessionState?.pathfinderOutput;
  const roadmap = sessionState?.roadmapOutput;
  const critic = sessionState?.criticVerdict;
  const inclusion = sessionState?.inclusionOutput;
  const narrator = sessionState?.narratorOutput;
  const employerReadiness = sessionState?.employerReadinessOutput;
  const traces = sessionState?.agentTraces || [];

  const currentQ = questionsList[currentQuestionIdx];

  // Atlas keeps these as human-context translations, not tactical ATS edits.
  const translatedBullets = twin?.gap?.translated_skills?.length
     ? twin.gap.translated_skills.map((skill) => {
        if (skill.toLowerCase().includes('schedule') || skill.toLowerCase().includes('coordination')) {
          return `Coordinated multi-stakeholder schedules & resource logistics across 3+ service vendors, maintaining 100% on-time milestone delivery.`;
        }
        if (skill.toLowerCase().includes('data') || skill.toLowerCase().includes('process')) {
          return `Maintained high-accuracy data records & documentation workflows with 0 SLA discrepancies using structured Excel validation.`;
        }
        return `Managed operations & crisis resolution under tight constraints, applying structured problem-solving to complex daily scenarios.`;
      })
    : [
        `Coordinated multi-stakeholder schedules & resource logistics, maintaining 100% on-time milestone delivery.`,
        `Maintained high-accuracy data records & documentation workflows with 0 SLA discrepancies using structured Excel validation.`,
      ];

  return (
    <div className="min-h-screen bg-surface-base text-ink font-sans selection:bg-brand-pink/20 selection:text-ink">
      {/* ==================================================================== */}
      {/* STEP 1: FULLSCREEN HERO — mirrors Explore Engine reference exactly   */}
      {/* ==================================================================== */}
      {step === 1 && (
        <div className="relative min-h-screen w-screen flex flex-col justify-center items-center overflow-y-auto bg-canvas text-ink selection:bg-brand-pink/20 animate-in fade-in duration-700 py-12">
            {/* Flow Field / Neural Particle Canvas Background */}
            <div className="absolute inset-0 pointer-events-none opacity-45">
              <NeuralBackground
                color={particleColor}
                backgroundColor="transparent"
                trailColor={trailColor}
                trailOpacity={0.15}
                particleCount={1400}
                speed={0.7}
              />
            </div>

            {/* Hero Content Container — Identical layout & typography to Explore Engine */}
            <div className="relative z-10 max-w-4xl mx-auto w-full text-center mb-6 px-4">
              {/* Pill Badge & Swarm Tip Tooltip */}
              <div className="flex items-center justify-center gap-2 mb-6">
                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-sm bg-brand-teal/10 border border-brand-teal/20 text-[11px] text-brand-teal font-bold tracking-widest uppercase">
                  <Sparkles size={12} className="fill-current" />
                  AI Atlas Orchestrator
                </span>

                <div className="relative group/help">
                  <button className="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                    <HelpCircle size={14} className="text-ink/30 group-hover/help:text-brand-teal transition-colors" />
                  </button>

                  <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-64 p-4 bg-white dark:bg-zinc-900 rounded-xl border border-black/10 dark:border-white/10 shadow-2xl opacity-0 invisible group-hover/help:opacity-100 group-hover/help:visible transition-all z-50 pointer-events-none text-left">
                    <div className="flex items-center gap-2 mb-2">
                      <Target size={12} className="text-brand-teal" />
                      <span className="text-[10px] font-bold uppercase tracking-widest text-ink/40">Atlas Swarm Tip</span>
                    </div>
                    <p className="text-[11px] leading-relaxed text-ink/70 dark:text-white/70">
                      Drop your PDF or paste resume text. Our 14 parallel agents analyze skill gaps, ATS keywords, and fairness immunity.
                    </p>
                    <div className="absolute left-1/2 -translate-x-1/2 top-full border-8 border-transparent border-t-white dark:border-t-zinc-900" />
                  </div>
                </div>
              </div>

              {/* Main Display Heading — Apple Typography (tight leading, negative tracking, elegant contrast) */}
              <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-ink mb-5 text-center leading-[1.08]">
                Your career path, <br className="hidden sm:block" />
                <span className="text-brand-pink italic font-serif font-normal">fully decoded.</span>
              </h1>

              {/* Subtitle — Apple Typography (clear, concise, balanced line length) */}
              <p className="text-base sm:text-xl text-muted max-w-lg mx-auto text-center leading-relaxed font-sans mb-10">
                Upload your resume, and our 14-agent swarm will map out your exact skills, gap protection, and path forward.
              </p>

              {/* Search Bar, Paste Editor, and Sub-Footer Meta — unified in a single max-w-3xl grid column */}
              <div className="w-full max-w-3xl mx-auto space-y-4 text-left">
                {/* 4 Interactive Hackathon Theme Persona Presets */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-mono font-bold uppercase tracking-wider text-muted">
                    <span className="flex items-center gap-1.5 text-brand-pink">
                      <Sparkles className="w-3.5 h-3.5" /> 1-Click Inclusive Workforce Personas
                    </span>
                    <span className="text-muted/60 hidden sm:inline">Select to load live case</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {DEMO_PRESETS.map((preset) => (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => {
                          setResumeText(preset.resume);
                          setUserGoal(preset.goal);
                          setUploadedFileName(null);
                          setPdfBase64(null);
                          setShowTextPaste(true);
                        }}
                        className="p-3 rounded-xl border border-hairline bg-surface-card hover:border-brand-pink/60 hover:bg-surface-soft text-left transition-all group flex flex-col justify-between cursor-pointer active:scale-[0.98] shadow-sm focus-visible:ring-2 focus-visible:ring-brand-pink focus-visible:outline-none"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-bold text-ink group-hover:text-brand-pink transition-colors truncate">
                            {preset.label}
                          </span>
                          <ArrowRight className="w-3.5 h-3.5 text-muted group-hover:text-brand-pink transition-transform group-hover:translate-x-0.5 shrink-0" />
                        </div>
                        <span className="text-[10px] font-mono text-muted mt-1 truncate">
                          {preset.tag}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Search Bar Card */}
                <div className="bg-surface-strong p-3 rounded-xl border border-hairline shadow-sm flex flex-col md:flex-row gap-3 tactile-card">
                  {/* Resume Upload Drop Zone */}
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 bg-canvas py-4 px-6 font-sans text-ink border border-ink/15 rounded-lg focus:border-ink/40 transition-all cursor-pointer group flex items-center justify-between gap-4 tactile-input"
                  >
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      accept=".txt,.md,.doc,.docx,.pdf"
                      className="hidden"
                    />
                    <div className="flex items-center gap-3.5 min-w-0 text-left">
                      <div className="w-10 h-10 rounded-lg bg-brand-pink/10 border border-brand-pink/20 text-brand-pink flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                        <Upload className="w-5 h-5" />
                      </div>
                      <div className="truncate">
                        <div className="text-sm font-semibold text-ink truncate">
                          {uploadedFileName ? uploadedFileName : 'Drop your Resume PDF here or click to browse'}
                        </div>
                        <div className="text-[11px] font-mono text-muted truncate">
                          {uploadedFileName ? 'PDF Resume Extracted • Agent Swarm Ready' : 'Supports PDF, DOCX, TXT • No typing required'}
                        </div>
                      </div>
                    </div>

                    {uploadedFileName ? (
                      <span className="text-xs font-mono font-bold text-emerald-500 bg-emerald-500/10 px-3 py-1 rounded-md border border-emerald-500/20 shrink-0">
                        ✓ Loaded
                      </span>
                    ) : (
                      <span className="text-xs font-mono text-muted group-hover:text-ink transition-colors shrink-0 hidden sm:inline">
                        Browse Files
                      </span>
                    )}
                  </div>

                  {analysisId && (
                    <div className="mb-5 rounded-2xl border border-brand-teal/25 bg-brand-teal/10 px-4 py-3 text-left">
                      <p className="text-xs font-bold text-brand-teal">Imported Analyze context</p>
                      <p className="mt-1 text-xs leading-5 text-muted">Atlas will reuse the hard facts from this analysis and ask only for strategic context.</p>
                    </div>
                  )}

                  {atlasError && (
                    <p role="alert" className="mb-5 rounded-xl border border-brand-pink/30 bg-brand-pink/10 px-4 py-3 text-xs font-medium leading-5 text-ink">
                      {atlasError}
                    </p>
                  )}

                  {/* START EXPLORATION Action Button */}
                  <button
                    onClick={() => startAtlasExploration(analysisId || undefined)}
                    disabled={loading || (!analysisId && !resumeText.trim() && !pdfBase64)}
                    className={`flex items-center justify-center gap-3 px-10 py-5 md:py-0 bg-primary dark:bg-brand-pink text-on-primary dark:text-white rounded-lg font-sans font-semibold text-button transition-all hover:bg-primary-active dark:hover:opacity-90 active:scale-[0.98] tactile-button ${
                      loading || (!analysisId && !resumeText.trim() && !pdfBase64) ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    {loading ? (
                      <span className="flex items-center gap-3">
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        MAPPING...
                      </span>
                    ) : (
                      <>
                        <span>START EXPLORATION</span>
                        <ArrowRight size={18} />
                      </>
                    )}
                  </button>
                </div>

                {/* Paste / Text Toggle Bar — perfectly aligned to max-w-3xl edges */}
                <div>
                  <div className="flex items-center justify-between text-[11px] font-mono px-1">
                    <button
                      onClick={() => setShowTextPaste(!showTextPaste)}
                      className="text-muted hover:text-ink transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <FileText className="w-3.5 h-3.5 text-brand-pink" />
                      <span>{showTextPaste ? 'Hide text editor' : 'Or paste resume text directly'}</span>
                    </button>
                    <span className="text-muted/60 font-bold uppercase tracking-widest text-[10px]">RESUME PARSED • 14 AGENTS</span>
                  </div>

                  {showTextPaste && (
                    <div className="mt-3 space-y-2">
                      <textarea
                        value={resumeText}
                        onChange={(e) => setResumeText(e.target.value)}
                        rows={5}
                        className="w-full bg-surface-card border border-hairline rounded-xl p-4 text-xs font-mono text-ink placeholder:text-muted/50 focus:outline-none focus:border-brand-pink/60 transition-all resize-none leading-relaxed shadow-sm"
                        placeholder="Paste resume text here..."
                      />
                      <input
                        type="text"
                        value={userGoal}
                        onChange={(e) => setUserGoal(e.target.value)}
                        className="w-full bg-surface-card border border-hairline rounded-xl px-4 py-3 text-xs font-mono text-ink placeholder:text-muted/50 focus:outline-none focus:border-brand-pink/60 transition-all shadow-sm"
                        placeholder="Optional: target goal (e.g. remote cybersecurity role)..."
                      />
                    </div>
                  )}
                </div>

                {/* Sub-Footer Meta — perfectly centered & aligned under the card column */}
                <div className="flex flex-wrap items-center justify-center gap-6 text-[10px] text-muted font-bold uppercase tracking-[0.2em] pt-6 border-t border-hairline/40">
                  <span className="flex items-center gap-1.5"><ShieldCheck size={14} className="text-brand-pink" /> GAP IMMUNITY GUARANTEED</span>
                  <span className="w-1 h-1 rounded-full bg-hairline" />
                  <span>14-AGENT PARALLEL SWARM</span>
                  <span className="w-1 h-1 rounded-full bg-hairline" />
                  <span>AI POWERED ANALYSIS</span>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ==================================================================== */}
        {/* STEPS 2 & 3 WORKSPACE LAYOUT (Header + Container)                    */}
        {/* ==================================================================== */}
        {step !== 1 && (
          <>
            <header className="sticky top-0 z-30 bg-surface-base/80 backdrop-blur-xl border-b border-hairline px-6 py-4">
              <div className="max-w-7xl mx-auto flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-ink text-on-primary flex items-center justify-center font-mono font-black text-base shadow-sm">
                    α
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h1 className="text-base sm:text-lg font-extrabold tracking-tight text-ink">SkillPath Atlas Orchestrator</h1>
                      <span className="px-3 py-1 rounded-full text-xs font-mono font-bold uppercase bg-brand-pink/10 text-brand-pink border border-brand-pink/30">
                        14 Sub-Agents Active
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-muted font-mono">
                      DAG Pipeline Scheduler • SHA-256 Cache • Non-Penalization Fairness Policy
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-sm font-mono text-muted hidden md:inline">
                    Phase: <strong className="text-ink font-bold uppercase">{sessionState?.phase || 'Ready'}</strong>
                  </span>
                  {step === 3 && (
                    <button
                      onClick={() => setStep(1)}
                      className="py-2.5 px-4 rounded-xl bg-surface-card hover:bg-surface-soft text-ink border border-hairline text-sm font-mono font-bold transition-all flex items-center gap-2 cursor-pointer active:scale-[0.97]"
                    >
                      <RotateCcw className="w-4 h-4" /> Start New Search
                    </button>
                  )}
                </div>
              </div>
            </header>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 pb-24">
              {/* STEP 2: MULTI-QUESTION INTERACTIVE INTAKE FLOW */}
              {step === 2 && (
          <div className="space-y-6 max-w-3xl mx-auto animate-in fade-in duration-300">
            <div className="bg-surface-card border-2 border-hairline rounded-3xl p-6 sm:p-8 shadow-sm">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-hairline">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-brand-ochre animate-ping" />
                  <h3 className="text-xs font-mono font-bold text-ink uppercase tracking-widest">
                    Atlas Agent Workspace • Interactive Intake Questions ({questionsList.length > 0 ? `${currentQuestionIdx + 1}/${questionsList.length}` : 'Scanning'})
                  </h3>
                </div>
                <span className="text-[11px] font-mono text-muted uppercase font-bold">Step 2 of 3</span>
              </div>

              {questionsList.length > 0 && currentQ ? (
                /* Multi-Question Interactive View */
                <div className="p-6 rounded-2xl bg-surface-soft border border-hairline space-y-4">
                  <div className="flex items-center justify-between text-brand-pink font-mono text-xs font-bold uppercase tracking-wider">
                    <span className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" /> Agent 2 (Doubt Resolver) Requesting Clarification
                    </span>
                    <span>Question {currentQuestionIdx + 1} of {questionsList.length}</span>
                  </div>

                  <h3 className="text-base sm:text-lg font-bold text-ink leading-snug">{currentQ.question}</h3>
                  <p className="text-xs text-muted leading-relaxed font-medium">
                    Select the answer that best fits your current situation to optimize role recommendations and roadmap sequencing:
                  </p>

                  <div className="space-y-3 pt-2">
                    {currentQ.options.map((opt, idx) => {
                      const isSelected = confirmedAnswers[currentQ.id] === opt;
                      return (
                        <label
                          key={idx}
                          onClick={() => setConfirmedAnswers({ ...confirmedAnswers, [currentQ.id]: opt })}
                          className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                            isSelected
                              ? 'bg-brand-pink/10 border-brand-pink text-ink font-bold shadow-sm'
                              : 'bg-surface-card border-hairline text-body hover:border-muted'
                          }`}
                        >
                          <input
                            type="radio"
                            name={`q_${currentQ.id}`}
                            checked={isSelected}
                            onChange={() => setConfirmedAnswers({ ...confirmedAnswers, [currentQ.id]: opt })}
                            className="accent-brand-pink"
                          />
                          <span className="text-xs font-semibold">{opt}</span>
                        </label>
                      );
                    })}
                  </div>

                  <div className="flex items-center justify-between pt-5 border-t border-hairline">
                    <button
                      onClick={() => {
                        if (currentQuestionIdx > 0) setCurrentQuestionIdx(currentQuestionIdx - 1);
                        else setStep(1);
                      }}
                      className="py-2.5 px-4 rounded-xl bg-surface-card hover:bg-surface-soft text-ink text-xs font-mono font-bold border border-hairline active:scale-[0.97]"
                    >
                      ← {currentQuestionIdx > 0 ? 'Previous Question' : 'Edit Profile'}
                    </button>

                    {currentQuestionIdx < questionsList.length - 1 ? (
                      <button
                        onClick={() => setCurrentQuestionIdx(currentQuestionIdx + 1)}
                        className="py-3 px-6 rounded-xl bg-ink hover:opacity-90 text-on-primary font-bold text-xs uppercase tracking-wider cursor-pointer shadow-sm active:scale-[0.97]"
                      >
                        Next Question ➔
                      </button>
                    ) : (
                      <button
                        onClick={handleConfirmAllAnswersAndContinue}
                        disabled={loading}
                        className="py-3 px-6 rounded-xl bg-ink hover:opacity-90 text-on-primary font-bold text-xs uppercase tracking-wider cursor-pointer shadow-sm active:scale-[0.97]"
                      >
                        {loading ? 'Running downstream agents...' : 'Confirm All & Generate Mission Plan ➔'}
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                /* Scanning Indicator */
                <div className="py-12 text-center space-y-4">
                  <div className="w-10 h-10 border-4 border-brand-pink border-t-transparent rounded-full animate-spin mx-auto" />
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-ink uppercase font-mono tracking-wider">Synthesizing Digital Twin & Role Matches</h4>
                    <p className="text-xs text-muted font-mono">Running Pathfinder graph search + 8-week curriculum generation...</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ==================================================================== */}
        {/* STEP 3: MISSION CONTROL DASHBOARD RESULTS & FEEDBACK                 */}
        {/* ==================================================================== */}
        {step === 3 && sessionState && (
          <main className="space-y-8 animate-in fade-in duration-500">
            {/* Live Agent Execution Notification Banner */}
            {agentNotification && (
              <div className="p-4 rounded-2xl bg-brand-teal/15 border-2 border-brand-teal text-ink font-mono text-xs sm:text-sm font-bold flex items-center justify-between shadow-lg animate-in slide-in-from-top-4 duration-300">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-brand-teal animate-ping" />
                  <span>{agentNotification}</span>
                </div>
                <button
                  onClick={() => setAgentNotification(null)}
                  className="text-xs text-muted hover:text-ink font-mono px-2 py-1 rounded bg-surface-card"
                >
                  Dismiss ✕
                </button>
              </div>
            )}

            {/* Top Status Bar */}
            <div className="flex items-center justify-between bg-surface-card p-4 sm:p-5 rounded-3xl border-2 border-hairline shadow-sm">
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 rounded-full bg-brand-teal/10 text-brand-teal border border-brand-teal/30 text-xs font-mono font-bold uppercase tracking-wider">
                  ✓ Exploration Complete
                </span>
                <span className="text-xs text-muted font-mono hidden sm:inline">
                  Candidate Stage: <strong className="text-ink">{twin?.career_stage?.replace(/_/g, ' ').toUpperCase()}</strong>
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowSapExportModal(true)}
                  className="py-2 px-3 sm:px-4 rounded-xl bg-blue-600/10 hover:bg-blue-600 hover:text-white text-blue-600 border border-blue-600/30 text-xs font-mono font-bold flex items-center gap-1.5 transition-all active:scale-[0.97] cursor-pointer shadow-sm"
                  title="Export standard Skills Portfolio JSON for SAP SuccessFactors Talent Intelligence Hub"
                >
                  <Database className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">SAP TIH Export</span>
                  <span className="sm:hidden">SAP</span>
                </button>
                <button
                  onClick={() => setShowFairnessModal(true)}
                  className="py-2 px-3 sm:px-4 rounded-xl bg-emerald-600/10 hover:bg-emerald-600 hover:text-white text-emerald-600 border border-emerald-600/30 text-xs font-mono font-bold flex items-center gap-1.5 transition-all active:scale-[0.97] cursor-pointer shadow-sm"
                  title="View and download certified 10-dimension Bias & Fairness Certificate"
                >
                  <Award className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Fairness Cert</span>
                  <span className="sm:hidden">Cert</span>
                </button>
                <button
                  onClick={() => setStep(1)}
                  className="py-2 px-3 sm:px-4 rounded-xl bg-surface-soft hover:bg-surface-strong text-ink text-xs font-mono font-bold border border-hairline flex items-center gap-2 cursor-pointer active:scale-[0.97]"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Start New Search</span>
                </button>
              </div>
            </div>

            {/* Agent 13 Narrator Briefing Header */}
            {narrator && (
              <section className="p-6 sm:p-8 rounded-3xl bg-surface-card border-2 border-hairline shadow-sm relative overflow-hidden">
                <div className="flex items-center gap-2 mb-3">
                  <span className="px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase bg-brand-pink/10 text-brand-pink border border-brand-pink/20 tracking-wider">
                    Agent 13: Narrator Mission Briefing
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-ink mb-3 tracking-tight">
                  {narrator.missionTitle}
                </h2>
                <p className="text-xs sm:text-sm text-body leading-relaxed mb-5 max-w-4xl font-medium">
                  {narrator.openingStatement}
                </p>

                {/* Key Insights */}
                {narrator.keyInsights && narrator.keyInsights.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-5">
                    {narrator.keyInsights.map((insight, idx) => (
                      <div key={idx} className="p-3.5 rounded-2xl bg-surface-soft border border-hairline text-xs text-ink flex items-center gap-3 font-medium">
                        <Check className="w-4 h-4 text-brand-teal shrink-0" />
                        <span>{insight}</span>
                      </div>
                    ))}
                  </div>
                )}

                {narrator.warningIfAny && (
                  <div className="p-4 rounded-2xl bg-brand-ochre/10 border border-brand-ochre/30 text-xs text-ink flex items-center gap-2.5 mb-4 font-semibold">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-brand-ochre" />
                    <span>{narrator.warningIfAny}</span>
                  </div>
                )}

                <div className="flex items-center justify-between pt-4 border-t border-hairline text-xs text-muted font-mono">
                  <span>Immediate Action Plan: <strong className="text-ink font-bold">{narrator.actionPlan}</strong></span>
                </div>
              </section>
            )}

            {/* Navigation Tabs */}
            <div data-lenis-prevent className="flex items-center gap-2 border-b border-hairline pb-3 overflow-x-auto overscroll-contain touch-pan-x scrollbar-none">
              <button
                onClick={() => setActiveTab('briefing')}
                className={`px-5 py-3 rounded-2xl text-sm md:text-base font-mono font-bold transition-all duration-150 active:scale-[0.97] flex items-center gap-2.5 cursor-pointer shrink-0 ${
                  activeTab === 'briefing'
                    ? 'bg-ink text-on-primary shadow-sm'
                    : 'bg-surface-card text-muted hover:text-ink border border-hairline'
                }`}
              >
                <UserCheck className="w-4 h-4" /> Career Twin & Pathfinder
              </button>
              <button
                onClick={() => setActiveTab('strategy')}
                className={`px-5 py-3 rounded-2xl text-sm md:text-base font-mono font-bold transition-all duration-150 active:scale-[0.97] flex items-center gap-2.5 cursor-pointer shrink-0 ${
                  activeTab === 'strategy'
                    ? 'bg-brand-teal text-white shadow-sm'
                    : 'bg-surface-card text-brand-teal border border-brand-teal/30 hover:bg-brand-teal/10'
                }`}
              >
                <Sparkles className="w-4 h-4" /> Strategic workspace
              </button>
              <button
                onClick={() => setActiveTab('matches')}
                className={`px-5 py-3 rounded-2xl text-sm md:text-base font-mono font-bold transition-all duration-150 active:scale-[0.97] flex items-center gap-2.5 cursor-pointer shrink-0 ${
                  activeTab === 'matches'
                    ? 'bg-ink text-on-primary shadow-sm'
                    : 'bg-surface-card text-muted hover:text-ink border border-hairline'
                }`}
              >
                <Compass className="w-4 h-4" /> Role Matches ({verifiedMatches.length})
              </button>
              <button
                onClick={() => setActiveTab('roadmap')}
                className={`px-5 py-3 rounded-2xl text-sm md:text-base font-mono font-bold transition-all duration-150 active:scale-[0.97] flex items-center gap-2.5 cursor-pointer shrink-0 ${
                  activeTab === 'roadmap'
                    ? 'bg-ink text-on-primary shadow-sm'
                    : 'bg-surface-card text-muted hover:text-ink border border-hairline'
                }`}
              >
                <Layers className="w-4 h-4" /> 8-Week Roadmap & Resources ({roadmap?.roadmapModules?.length || 8})
              </button>
              <button
                onClick={() => setActiveTab('fairness')}
                className={`px-5 py-3 rounded-2xl text-sm md:text-base font-mono font-bold transition-all duration-150 active:scale-[0.97] flex items-center gap-2.5 cursor-pointer shrink-0 ${
                  activeTab === 'fairness'
                    ? 'bg-ink text-on-primary shadow-sm'
                    : 'bg-surface-card text-muted hover:text-ink border border-hairline'
                }`}
              >
                <ShieldCheck className="w-4 h-4" /> Bias & Fairness Audit ({inclusion?.inclusionScore || 100}/100)
              </button>
              <button
                onClick={() => setActiveTab('readiness')}
                className={`px-5 py-3 rounded-2xl text-sm md:text-base font-mono font-bold transition-all duration-150 active:scale-[0.97] flex items-center gap-2.5 cursor-pointer shrink-0 ${
                  activeTab === 'readiness'
                    ? 'bg-ink text-on-primary shadow-sm'
                    : 'bg-surface-card text-muted hover:text-ink border border-hairline'
                }`}
              >
                <Briefcase className="w-4 h-4" /> Employer Readiness ({employerReadiness?.overallReadinessScore || 88}/100)
              </button>
              <button
                onClick={() => setActiveTab('copilot')}
                className={`px-5 py-3 rounded-2xl text-sm md:text-base font-mono font-bold transition-all duration-150 active:scale-[0.97] flex items-center gap-2.5 cursor-pointer shrink-0 ${
                  activeTab === 'copilot'
                    ? 'bg-brand-pink text-white shadow-sm'
                    : 'bg-surface-card text-brand-pink border border-brand-pink/30 hover:bg-brand-pink/10'
                }`}
              >
                <MessageSquare className="w-4 h-4" /> AI Career Copilot 💬
              </button>
            </div>

            {/* TAB 1: BRIEFING */}
            {activeTab === 'briefing' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Career Digital Twin Panel */}
                  {twin && (
                    <div className="lg:col-span-4 p-6 sm:p-8 rounded-3xl bg-surface-card border-2 border-hairline shadow-sm flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-5 pb-4 border-b border-hairline">
                          <h3 className="text-sm font-mono text-brand-pink font-bold uppercase tracking-wider flex items-center gap-2">
                            <UserCheck className="w-4 h-4" /> 1. Career Digital Twin
                          </h3>
                          <span className="text-xs font-mono bg-brand-pink/10 text-brand-pink border border-brand-pink/30 px-3 py-1 rounded-full font-bold">
                            Readiness: {twin.readiness_score}/100
                          </span>
                        </div>

                        <div className="space-y-5 text-sm font-medium">
                          <div>
                            <span className="text-muted block text-xs font-mono uppercase font-bold">Location & Hub</span>
                            <span className="font-bold text-ink text-base flex items-center gap-1.5 mt-1">
                              <MapPin className="w-4 h-4 text-brand-pink" /> {twin.location} ({twin.locationTier || 'tier2'})
                            </span>
                          </div>

                          <div>
                            <span className="text-muted block text-xs font-mono uppercase font-bold">Career Stage</span>
                            <span className="inline-block mt-1 px-3.5 py-1.5 rounded-xl bg-brand-lavender/20 text-ink border border-brand-lavender/40 font-mono text-xs font-bold uppercase tracking-wide">
                              {twin.career_stage.replace(/_/g, ' ')}
                            </span>
                          </div>

                          {/* Confirmed Gap Badge */}
                          {twin.gap && twin.gap.duration_months > 0 && (
                            <div className="p-4 rounded-2xl bg-brand-mint/20 border border-brand-mint/40 space-y-2">
                              <div className="flex items-center justify-between text-ink font-bold text-sm">
                                <span className="flex items-center gap-2">
                                  <Heart className="w-4 h-4 text-brand-pink" /> Confirmed Career Break
                                </span>
                                <span>{twin.gap.duration_months} Months</span>
                              </div>
                              <p className="text-xs text-body font-medium">
                                Reason: <span className="font-bold text-ink">{twin.gap.reason}</span>
                              </p>
                              <span className="inline-block text-xs font-mono text-ink bg-white dark:bg-zinc-800 px-3 py-1 rounded-md font-bold uppercase tracking-wider border border-hairline">
                                Gap Non-Penalization Policy Active
                              </span>
                            </div>
                          )}

                          {/* Skills List */}
                          <div>
                            <span className="text-muted block text-xs font-mono uppercase font-bold mb-2">
                              Extracted Skills ({twin.skills.length})
                            </span>
                            <div data-lenis-prevent className="flex flex-wrap gap-2 max-h-48 overflow-y-auto overscroll-contain touch-pan-y pr-1 scrollbar-thin">
                              {twin.skills.map((s, i) => (
                                <span
                                  key={i}
                                  className={`px-3 py-1 rounded-lg text-xs font-mono font-bold ${
                                    s.informalSource
                                      ? 'bg-brand-ochre/20 text-ink border border-brand-ochre/40'
                                      : 'bg-surface-soft text-ink border border-hairline'
                                  }`}
                                >
                                  {s.name}
                                  {s.informalSource && ' ★'}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="mt-5 pt-4 border-t border-hairline flex flex-wrap gap-2">
                        {twin.inclusion_flags.map((flag, idx) => (
                          <span key={idx} className="text-xs font-mono px-3 py-1 rounded-md bg-surface-soft text-muted border border-hairline font-bold">
                            #{flag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Pathfinder & Critic Assessment Panel */}
                  <div className="lg:col-span-8 space-y-6">
                    {/* Critic Assessment */}
                    {critic && (
                      <div className="p-6 rounded-3xl bg-surface-card border-2 border-hairline shadow-sm">
                        <div className="flex items-center justify-between mb-4 pb-3 border-b border-hairline">
                          <h3 className="text-sm font-mono text-brand-ochre font-bold uppercase tracking-wider flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4" /> Agent 6 (Critic Agent): Honest Audit
                          </h3>
                          <span className="text-xs font-mono text-ink bg-brand-ochre/20 px-3 py-1 rounded-full border border-brand-ochre/40 font-bold uppercase tracking-wider">
                            Zero Overpromising Policy
                          </span>
                        </div>
                        <p className="text-sm text-body leading-relaxed mb-4 font-medium">
                          {critic.honestTruth}
                        </p>
                        <div className="p-4 rounded-2xl bg-brand-teal/10 border border-brand-teal/30 text-sm text-ink font-medium leading-relaxed">
                          <span className="font-bold block mb-1 font-mono uppercase text-xs text-brand-teal">Positive Strength Reframe:</span>
                          {critic.positiveReframe}
                        </div>
                      </div>
                    )}

                    {/* Pathfinder Bridge Steps */}
                    {pathfinder && (
                      <div className="p-6 rounded-3xl bg-surface-card border-2 border-hairline shadow-sm">
                        <div className="flex items-center justify-between mb-4 pb-3 border-b border-hairline">
                          <h3 className="text-sm font-mono text-brand-teal font-bold uppercase tracking-wider flex items-center gap-2">
                            <Compass className="w-4 h-4" /> Agent 7 (Pathfinder): Bridge Career Path
                          </h3>
                          <span className="text-xs font-mono text-muted font-bold uppercase">
                            Total Journey: {pathfinder.totalMonthsToTarget} Months
                          </span>
                        </div>

                        <div className="space-y-3">
                          {pathfinder.shortestPath.map((stepItem, idx) => (
                            <div key={idx} className="p-4 rounded-2xl bg-surface-soft border border-hairline flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                              <div className="flex items-center gap-3.5">
                                <span className="w-9 h-9 rounded-full bg-brand-teal/20 text-ink border border-brand-teal/40 font-mono text-sm font-bold flex items-center justify-center shrink-0">
                                  {stepItem.stepNumber}
                                </span>
                                <div>
                                  <h4 className="text-sm sm:text-base font-bold text-ink">{stepItem.role}</h4>
                                  <div className="text-xs text-muted flex items-center gap-2 mt-0.5 font-mono">
                                    <span>{stepItem.salaryRange}</span>
                                    <span>•</span>
                                    <span className="text-brand-teal font-bold">{stepItem.estimatedMonths} Months at this step</span>
                                  </div>
                                </div>
                              </div>
                              <div className="text-xs font-mono text-muted sm:text-right max-w-xs">
                                <span className="text-muted block uppercase font-bold">Gate:</span>
                                <span className="text-ink font-medium">{stepItem.readinessGate}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Informal skill translation — strategic context, not a resume editor */}
                <div className="p-6 sm:p-8 rounded-3xl bg-surface-card border-2 border-hairline shadow-sm space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-hairline">
                    <h3 className="text-sm font-mono text-brand-pink font-bold uppercase tracking-wider flex items-center gap-2">
                      <Briefcase className="w-4 h-4" /> Market-ready translations (Copy & Paste)
                    </h3>
                    <span className="text-xs font-mono text-muted uppercase font-bold">Empowered Reframe</span>
                  </div>

                  <p className="text-sm text-muted leading-relaxed">
                    Atlas translated lived experience and informal work into language you can use when telling your career story. Verify every claim before using it:
                  </p>

                  <div className="space-y-3">
                    {translatedBullets.map((bullet, idx) => (
                      <div key={idx} className="p-4 rounded-2xl bg-surface-soft border border-hairline flex items-center justify-between gap-4">
                        <p className="text-sm font-mono text-ink leading-relaxed font-medium">"{bullet}"</p>
                        <button
                          onClick={() => copyToClipboard(bullet, idx)}
                          className="py-2 px-3.5 rounded-xl bg-surface-card hover:bg-surface-strong text-ink text-xs font-mono font-bold border border-hairline flex items-center gap-1.5 shrink-0 active:scale-[0.97]"
                        >
                          <Copy className="w-3.5 h-3.5 text-brand-pink" />
                          {copiedBulletIdx === idx ? 'Copied!' : 'Copy'}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Interactive Future Career Simulator Widget */}
                <div className="p-6 sm:p-8 rounded-3xl bg-surface-card border-2 border-hairline shadow-sm space-y-6">
                  <div className="flex items-center justify-between pb-3 border-b border-hairline">
                    <h3 className="text-sm font-mono text-brand-teal font-bold uppercase tracking-wider flex items-center gap-2">
                      <Sliders className="w-4 h-4" /> Agent 10: Interactive Future Career & Salary Simulator
                    </h3>
                    <span className="text-xs font-mono bg-brand-teal/10 text-brand-teal border border-brand-teal/30 px-3 py-0.5 rounded-full font-bold">
                      Live Dynamic Recalculation
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Controls */}
                    <div className="space-y-6">
                      <div>
                        <div className="flex justify-between text-sm font-mono font-bold mb-2">
                          <span>Learning Commitment:</span>
                          <span className="text-brand-teal">{simHours} Hours / Week</span>
                        </div>
                        <input
                          type="range"
                          min="4"
                          max="30"
                          value={simHours}
                          onChange={(e) => setSimHours(Number(e.target.value))}
                          className="w-full accent-brand-teal cursor-pointer"
                        />
                      </div>

                      <div>
                        <div className="flex justify-between text-sm font-mono font-bold mb-2">
                          <span>Completed Hands-On Projects:</span>
                          <span className="text-brand-pink">{simProjects} Labs / Projects</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="8"
                          value={simProjects}
                          onChange={(e) => setSimProjects(Number(e.target.value))}
                          className="w-full accent-brand-pink cursor-pointer"
                        />
                      </div>
                    </div>

                    {/* Calculated Outcome */}
                    <div className="p-5 rounded-2xl bg-surface-soft border border-hairline flex flex-col justify-between space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono text-muted font-bold uppercase">Simulated Role Readiness:</span>
                        <span className="text-base font-black font-mono text-brand-teal">
                          {Math.min(98, (twin?.readiness_score || 72) + simHours * 0.8 + simProjects * 3).toFixed(0)}%
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono text-muted font-bold uppercase">Estimated Time to First Offer:</span>
                        <span className="text-sm font-bold font-mono text-ink">
                          {Math.max(4, 12 - Math.round(simHours / 3) - simProjects)} Weeks
                        </span>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-hairline">
                        <span className="text-xs font-mono text-muted font-bold uppercase">Projected Target Salary:</span>
                        <span className="text-base font-black font-mono text-ink">
                          ₹{(6.5 + simProjects * 0.75).toFixed(1)} LPA
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'strategy' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                {sessionState?.source?.analysisId && (
                  <div className="rounded-2xl border border-brand-teal/25 bg-brand-teal/10 px-5 py-4">
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-teal">Imported context</p>
                    <p className="mt-2 text-sm leading-6 text-ink">Analyze already handled the deterministic resume facts. Atlas is using them as context while this workspace focuses on decisions, confidence, and market strategy.</p>
                  </div>
                )}
                <div className="grid gap-6 lg:grid-cols-2">
                  {featureFlags.showCareerTwinDNA && <CareerTwinDNA twin={twin} softSignals={sessionState?.softSignals} />}
                  {featureFlags.showGapAlchemy && <GapAlchemy softSignals={sessionState?.softSignals} />}
                  {featureFlags.showBridgeRoleLadder && <BridgeRoleLadder path={pathfinder?.shortestPath} />}
                  {featureFlags.showFutureProofRadar && <FutureProofRadar skills={sessionState?.skillGraph?.allSkills} />}
                  {featureFlags.showInterviewDojo && <InterviewDojo role={pathfinder?.shortestPath?.[pathfinder.shortestPath.length - 1]?.role || twin?.goalDecoded?.primaryTarget} />}
                  {featureFlags.showSalaryWarRoom && <SalaryWarRoom baseline={twin?.preferences?.target_salary_lpa || 6} />}
                  {featureFlags.showHiddenDoorNetwork && <HiddenDoorNetwork targetRole={pathfinder?.shortestPath?.[pathfinder.shortestPath.length - 1]?.role || twin?.goalDecoded?.primaryTarget} />}
                  {featureFlags.showEmployerCourt && <EmployerCourt readiness={employerReadiness} />}
                  {featureFlags.showShadowBoard && <ShadowBoard targetRole={pathfinder?.shortestPath?.[pathfinder.shortestPath.length - 1]?.role || twin?.goalDecoded?.primaryTarget} />}
                </div>
              </div>
            )}

            {/* TAB 2: ROLE MATCHES */}
            {activeTab === 'matches' && matcher && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {verifiedMatches.map((role: any, idx: number) => {
                  const matchingSkills: string[] = role.matching_skills || role.matchingSkills || [];
                  const missingSkills: string[] = role.missing_skills || role.missingSkills || [];
                  const readyNow: boolean = Boolean(role.ready_now ?? role.readyNow);
                  const weeksToReady: number = Number(role.weeks_to_ready ?? role.weeksToReady ?? 0);
                  const salaryAvgLpa: number = Number(role.salary_avg_lpa ?? role.salaryAvgLpa ?? 5.5);
                  const matchScore: number = Number(role.match_score ?? role.matchScore ?? 0.8);

                  return (
                    <div
                      key={idx}
                      className={`p-6 rounded-3xl border-2 flex flex-col justify-between shadow-sm ${
                        readyNow
                          ? 'bg-brand-mint/10 border-brand-mint'
                          : 'bg-surface-card border-hairline'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <span className={`text-xs font-mono font-bold px-3 py-1 rounded-full uppercase tracking-wider ${
                            readyNow ? 'bg-brand-teal/20 text-ink' : 'bg-brand-ochre/20 text-ink'
                          }`}>
                            {readyNow ? 'READY NOW' : `BRIDGE (+${weeksToReady} WKS)`}
                          </span>
                          <span className="text-base font-bold font-mono text-ink">
                            {Math.round(matchScore * 100)}% Match
                          </span>
                        </div>

                        <h4 className="text-base font-bold text-ink mb-1">{role.role}</h4>
                        <div className="text-sm font-mono text-muted mb-4">
                          ~₹{salaryAvgLpa} LPA Average Salary
                        </div>

                        <div className="space-y-4 text-sm mb-6">
                          <div>
                            <span className="text-brand-teal font-bold block text-xs font-mono uppercase tracking-wider mb-1">Matching Skills:</span>
                            <div className="flex flex-wrap gap-2">
                              {matchingSkills.map((s, i) => (
                                <span key={i} className="px-2.5 py-1 rounded-md bg-brand-teal/10 text-ink border border-brand-teal/30 text-xs font-mono font-medium">
                                  {s}
                                </span>
                              ))}
                            </div>
                          </div>

                          {missingSkills.length > 0 && (
                            <div>
                              <span className="text-brand-pink font-bold block text-xs font-mono uppercase tracking-wider mb-1">Missing Prerequisite Skills & Free Tutorials:</span>
                              <div className="flex flex-wrap gap-2 mt-2">
                                {missingSkills.map((sk, i) => (
                                  <a
                                    key={i}
                                    href={`https://www.youtube.com/results?search_query=free+learn+${encodeURIComponent(sk)}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-3 py-1.5 rounded-lg bg-brand-pink/10 hover:bg-brand-pink/20 text-ink border border-brand-pink/30 text-xs font-mono font-bold flex items-center gap-1.5 transition-all active:scale-[0.97]"
                                  >
                                    <span>{sk}</span>
                                    <ExternalLink className="w-3.5 h-3.5 text-brand-pink" />
                                  </a>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => handleCompareRole(role.role)}
                        className="w-full py-3.5 px-4 rounded-2xl bg-surface-soft hover:bg-surface-strong text-ink border border-hairline text-sm font-mono font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm active:scale-[0.97]"
                      >
                        <GitCompare className="w-4 h-4" /> Compare Role Switch
                      </button>
                    </div>
                  );
                })}
                </div>
              </div>
            )}

            {/* TAB 3: ROADMAP & REAL RESOURCE LINKS */}
            {activeTab === 'roadmap' && roadmap && (
              <div className="space-y-6">
                <div className="p-6 sm:p-8 rounded-3xl bg-surface-card border-2 border-hairline shadow-sm space-y-6">
                  {/* Day-Based Job Readiness Header */}
                  <div className="p-6 rounded-2xl bg-gradient-to-r from-brand-teal/15 via-brand-lavender/15 to-brand-pink/15 border-2 border-brand-teal/40 flex flex-col md:flex-row md:items-center justify-between gap-5 shadow-sm">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-3 py-1 rounded-full bg-brand-teal text-white text-xs font-mono font-bold uppercase tracking-wider">
                          🎯 Target Job-Ready Timeline
                        </span>
                        <span className="text-xs font-mono text-muted font-bold">
                          Daily Pacing: ~{roadmap.dailyPacingHours || 2.5} hrs/day
                        </span>
                      </div>
                      <h2 className="text-2xl sm:text-3xl font-black font-mono text-ink tracking-tight">
                        {roadmap.totalDaysToJobReady || (roadmap.totalWeeks * 7)} Days to Land Job
                      </h2>
                      <p className="text-sm font-mono text-muted mt-1 font-semibold">
                        Estimated Ready-to-Hire Date: <strong className="text-brand-teal font-bold">{roadmap.estimatedJobReadyDate || 'Sept 20, 2026'}</strong> | Target Role: <strong className="text-ink font-bold">{roadmap.targetRole}</strong>
                      </p>
                    </div>

                    <div className="flex flex-col items-start md:items-end gap-1 shrink-0">
                      <span className="text-xs font-mono text-muted uppercase font-bold">Total Time Investment</span>
                      <span className="text-xl font-mono font-black text-brand-pink">
                        {roadmap.totalHoursInvestment || (roadmap.weeklyHoursRequired * roadmap.totalWeeks)} Hours
                      </span>
                    </div>
                  </div>

                  {/* Day Milestones Bar */}
                  {roadmap.dayMilestones && roadmap.dayMilestones.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      {roadmap.dayMilestones.map((ms, idx) => (
                        <div key={idx} className="p-4 rounded-2xl bg-surface-soft border border-hairline space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-mono font-bold text-brand-pink uppercase tracking-wider">{ms.dayRange}</span>
                            {ms.readyToApply && (
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-brand-mint/30 text-ink border border-brand-mint/50 font-bold uppercase">Ready to Apply</span>
                            )}
                          </div>
                          <h4 className="text-sm font-bold text-ink leading-snug">{ms.phaseTitle}</h4>
                          <ul className="text-xs text-muted space-y-1 font-medium pt-1">
                            {ms.keyDeliverables.map((del, dIdx) => (
                              <li key={dIdx} className="flex items-start gap-1.5">
                                <span className="text-brand-teal font-bold">•</span>
                                <span>{del}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-hairline">
                    <div>
                      <h3 className="text-base sm:text-lg font-mono text-brand-pink font-bold uppercase tracking-wider flex items-center gap-2">
                        <Layers className="w-5 h-5" /> Agent 8: Personalized Week-by-Week Curriculum & Free Resources
                      </h3>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {roadmap.roadmapModules.map((mod, idx) => (
                      <div key={idx} className="p-6 rounded-2xl bg-surface-soft border border-hairline flex flex-col justify-between space-y-4">
                        <div>
                          <div className="flex items-center justify-between text-xs font-mono font-bold text-brand-pink mb-2">
                            <span>WEEK {mod.week}</span>
                            <span className="text-muted">{mod.weeklyTimeCommitment || 12} HRS</span>
                          </div>
                          <h4 className="text-base font-bold text-ink mb-2">{mod.moduleTitle}</h4>
                          <p className="text-sm text-body mb-4 font-medium leading-relaxed">{mod.learningObjective}</p>

                          <div className="mb-4">
                            <span className="text-xs font-mono text-muted uppercase block mb-1.5 font-bold">Key Skills Covered</span>
                            <div className="flex flex-wrap gap-1.5">
                              {mod.keySkillsThisWeek?.map((sk, i) => (
                                <span key={i} className="px-2.5 py-1 rounded-md bg-surface-card border border-hairline text-ink text-xs font-mono font-medium">
                                  {sk}
                                </span>
                              ))}
                            </div>
                          </div>

                          {/* Free Clickable Resources */}
                          {mod.resources && mod.resources.length > 0 && (
                            <div className="space-y-2">
                              <span className="text-xs font-mono text-muted uppercase block font-bold">
                                Recommended Free Resources & Labs:
                              </span>
                              <div className="space-y-2">
                                {mod.resources.map((res, rIdx) => (
                                  <a
                                    key={rIdx}
                                    href={res.url || `https://www.google.com/search?q=${encodeURIComponent(res.name)}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-3 rounded-xl bg-surface-card hover:bg-surface-strong border border-hairline text-sm font-mono text-ink flex items-center justify-between group transition-all active:scale-[0.97]"
                                  >
                                    <div className="flex items-center gap-2 overflow-hidden">
                                      <BookOpen className="w-4 h-4 text-brand-pink shrink-0" />
                                      <span className="truncate font-semibold">{res.name}</span>
                                      <span className="text-xs text-muted font-normal">({res.platform})</span>
                                    </div>
                                    <ExternalLink className="w-4 h-4 text-muted group-hover:text-brand-pink shrink-0 transition-colors" />
                                  </a>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        {mod.handsOnProject && (
                          <div className="p-4 rounded-xl bg-brand-ochre/15 border border-brand-ochre/30 text-sm">
                            <span className="text-xs font-mono text-ink font-bold uppercase block mb-1">
                              Hands-On Project: {mod.handsOnProject.title}
                            </span>
                            <p className="text-sm text-body font-medium leading-relaxed">{mod.handsOnProject.description}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: FAIRNESS AUDIT */}
            {activeTab === 'fairness' && inclusion && (
              <div className="space-y-6">
                <div className="p-6 sm:p-8 rounded-3xl bg-surface-card border-2 border-hairline shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-4 border-b border-hairline">
                    <h3 className="text-base sm:text-lg font-mono text-brand-teal font-bold uppercase tracking-wider flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5" /> Agent 9: Bias & Inclusion Audit
                    </h3>
                    <span className="text-sm font-mono font-bold bg-brand-teal/10 text-brand-teal border border-brand-teal/30 px-4 py-1.5 rounded-full">
                      Score: {inclusion.inclusionScore}/100 (Grade {inclusion.grade})
                    </span>
                  </div>

                  <p className="text-base text-body mb-6 font-medium leading-relaxed">{inclusion.inclusionNarrative}</p>

                  {/* Demographic & Credential Skew Governance Monitor */}
                  {inclusion.demographicSkewMonitor && inclusion.demographicSkewMonitor.length > 0 && (
                    <div className="mb-6 space-y-3">
                      <h4 className="text-sm font-bold text-ink mb-3 font-mono uppercase tracking-wider">
                        Demographic & Credential Bias Governance Monitor:
                      </h4>
                      {inclusion.demographicSkewMonitor.map((mon, idx) => (
                        <div key={idx} className="p-4 rounded-2xl bg-surface-soft border border-hairline flex items-center justify-between text-sm font-mono">
                          <div className="flex items-center gap-3">
                            <span className="w-2.5 h-2.5 rounded-full bg-brand-teal" />
                            <span className="font-bold text-ink text-base">{mon.metric}</span>
                          </div>
                          <span className="text-xs text-muted">{mon.note}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="space-y-3 mb-6">
                    <h4 className="text-sm font-bold text-ink mb-3 font-mono uppercase tracking-wider">Applied Inclusion Guarantees:</h4>
                    {inclusion.appliedProtections.map((p, idx) => (
                      <div key={idx} className="p-4 rounded-2xl bg-surface-soft border border-hairline text-sm font-mono flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <CheckCircle2 className="w-4 h-4 text-brand-teal" />
                          <span className="font-bold text-ink text-base">{p.policy}</span>
                        </div>
                        <span className="text-xs text-muted">{p.evidence}</span>
                      </div>
                    ))}
                  </div>

                  {inclusion.returnshipPrograms && inclusion.returnshipPrograms.length > 0 && (
                    <div className="p-5 rounded-2xl bg-brand-lavender/10 border border-brand-lavender/30">
                      <h4 className="text-sm font-bold text-ink mb-3 font-mono uppercase tracking-wider">
                        Matched Corporate Returnship Programs:
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {inclusion.returnshipPrograms.map((prog, idx) => (
                          <span key={idx} className="px-3.5 py-1.5 rounded-xl bg-surface-card border border-hairline text-sm font-mono font-bold text-ink">
                            ✨ {prog}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 5: EMPLOYER READINESS & HR ACCOMMODATIONS */}
            {activeTab === 'readiness' && (
              <div className="space-y-6">
                <div className="p-6 sm:p-8 rounded-3xl bg-surface-card border-2 border-hairline shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-4 border-b border-hairline">
                    <h3 className="text-base sm:text-lg font-mono text-brand-pink font-bold uppercase tracking-wider flex items-center gap-2">
                      <Briefcase className="w-5 h-5" /> Agent 14: Employer Readiness & Accessibility Audit
                    </h3>
                    <span className="text-sm font-mono font-bold bg-brand-pink/10 text-brand-pink border border-brand-pink/30 px-4 py-1.5 rounded-full">
                      Score: {employerReadiness?.overallReadinessScore || 88}/100 (Grade {employerReadiness?.accessibilityGrade || 'A'})
                    </span>
                  </div>

                  <p className="text-base text-body mb-6 font-medium leading-relaxed">
                    {employerReadiness?.readinessSummary || 'Employer Readiness Audit evaluates job roles to eliminate exclusionary requirements and surface actionable HR accommodations.'}
                  </p>

                  {/* Flagged Exclusionary Terms */}
                  <div className="mb-8">
                    <h4 className="text-sm font-bold text-ink mb-4 font-mono uppercase tracking-wider">
                      Exclusionary Language Audit ({employerReadiness?.exclusionaryTermsFlagged?.length || 0} Flagged):
                    </h4>
                    {employerReadiness?.exclusionaryTermsFlagged && employerReadiness.exclusionaryTermsFlagged.length > 0 ? (
                      <div className="space-y-4">
                        {employerReadiness.exclusionaryTermsFlagged.map((ex: ExclusionaryTerm, idx: number) => (
                          <div key={idx} className="p-5 rounded-2xl bg-brand-ochre/10 border border-brand-ochre/30 text-sm space-y-2">
                            <div className="flex items-center justify-between mb-1 font-mono">
                              <span className="text-base font-bold text-ink">🚩 {ex.term}</span>
                              <span className="text-xs uppercase font-bold text-brand-ochre">{ex.category}</span>
                            </div>
                            <p className="text-sm text-body font-medium leading-relaxed">{ex.explanation}</p>
                            <div className="p-3 rounded-xl bg-surface-card border border-hairline font-mono text-sm text-ink">
                              <strong>Recommended Alternative:</strong> <span className="font-semibold text-brand-teal">{ex.recommendedAlternative}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-5 rounded-2xl bg-surface-soft border border-hairline text-sm font-mono text-ink flex items-center gap-3">
                        <CheckCircle2 className="w-5 h-5 text-brand-teal shrink-0" />
                        <span>No exclusionary language or restrictive credential mandates detected in this role.</span>
                      </div>
                    )}
                  </div>

                  {/* Recommended HR Accommodation Actions */}
                  <div>
                    <h4 className="text-sm font-bold text-ink mb-4 font-mono uppercase tracking-wider">
                      Recommended HR Accommodations & Policy Adjustments:
                    </h4>
                    <div className="space-y-4">
                      {(employerReadiness?.hrAccommodationActions || [
                        { id: 'act-1', category: 'gap_protection', title: 'Caregiving & Sabbatical Gap Immunity Policy', description: 'Waive rigid gap penalties; evaluate candidates on skills discovery and project work.', status: 'recommended' },
                        { id: 'act-2', category: 'credential_flexibility', title: 'Skill-First Qualification Waiver', description: 'Replace mandatory 4-year degree requirements with verified project milestones.', status: 'recommended' },
                        { id: 'act-3', category: 'remote_accessibility', title: 'Flexible Core Hours & Async Onboarding', description: 'Provide flexible hours for caretakers and remote-first onboarding.', status: 'recommended' },
                      ]).map((act: HrAccommodationAction, idx: number) => (
                        <div key={idx} className="p-5 rounded-2xl bg-surface-soft border border-hairline text-sm flex items-center justify-between gap-4">
                          <div>
                            <div className="flex items-center gap-2 font-mono text-base font-bold text-ink mb-1">
                              <Sparkles className="w-4 h-4 text-brand-teal shrink-0" />
                              <span>{act.title}</span>
                            </div>
                            <p className="text-sm text-body font-medium leading-relaxed mt-1">{act.description}</p>
                          </div>
                          <span className="px-3.5 py-1.5 rounded-full text-xs font-mono font-bold uppercase bg-brand-teal/10 text-brand-teal border border-brand-teal/30 shrink-0">
                            {act.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 5: AGENT TRACES */}
            {activeTab === 'traces' && (
              <div className="space-y-4">
                <div className="p-6 rounded-3xl bg-surface-card border-2 border-hairline shadow-sm">
                  <h3 className="text-xs font-mono text-muted font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-brand-pink" /> Audit Trail — 13 Sub-Agent Execution Logs
                  </h3>

                  <div className="space-y-2">
                    {traces.map((t, idx) => (
                      <div key={idx} className="p-3.5 rounded-2xl bg-surface-soft border border-hairline flex items-center justify-between text-xs font-mono">
                        <div className="flex items-center gap-3">
                          <span className="w-2 h-2 rounded-full bg-brand-teal" />
                          <span className="font-bold text-ink">{t.agentName}</span>
                          <span className="text-[10px] text-muted">({t.agentId})</span>
                        </div>
                        <div className="flex items-center gap-3 text-muted">
                          <span>{t.message}</span>
                          {t.durationMs && <span className="font-bold text-ink">{t.durationMs}ms</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 6: AI CAREER COPILOT CHATBOT */}
            {activeTab === 'copilot' && (
              <div className="animate-in fade-in duration-300">
                <AtlasCopilotChat
                  onExecuteAgentCommand={handleExecuteAgentCommand}
                  sessionContext={{
                    sessionState,
                    digitalTwin: twin,
                    skillGap: twin?.gap,
                    roleMatches: verifiedMatches,
                    roadmap,
                    fairnessAudit: inclusion,
                    employerReadiness,
                    narrator,
                    resumeText,
                  }}
                />
              </div>
            )}
          </main>
        )}

      {/* FLOATING CAREER COPILOT BUTTON & DRAWER (Step 3) */}
      {step === 3 && (
        <>
          <div className="fixed bottom-6 right-6 z-40">
            <button
              onClick={() => setShowFloatingChat(!showFloatingChat)}
              className="p-4 rounded-full bg-brand-pink hover:bg-brand-pink/90 text-white shadow-2xl transition-all duration-200 cursor-pointer flex items-center gap-2.5 active:scale-[0.95] group border-2 border-white/20"
              title="Open Atlas Career Copilot"
            >
              <Bot className="w-6 h-6 group-hover:rotate-12 transition-transform" />
              <span className="text-xs font-sans font-bold uppercase tracking-wider hidden sm:inline">Ask Copilot</span>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            </button>
          </div>

          {showFloatingChat && (
            <div
              data-lenis-prevent="true"
              className="fixed bottom-24 right-4 sm:right-6 z-50 w-[92vw] sm:w-[440px] max-h-[80vh] flex flex-col animate-in slide-in-from-bottom-5 duration-200 shadow-2xl rounded-3xl"
            >
              <div className="relative w-full h-full flex flex-col min-h-0">
                <button
                  onClick={() => setShowFloatingChat(false)}
                  className="absolute top-3.5 right-3.5 z-20 w-6 h-6 flex items-center justify-center rounded-full bg-surface-card hover:bg-surface-strong text-muted hover:text-ink text-xs font-bold border border-hairline cursor-pointer shadow-sm transition-colors"
                  title="Close Copilot Drawer"
                >
                  ✕
                </button>
                <AtlasCopilotChat
                  onExecuteAgentCommand={handleExecuteAgentCommand}
                  sessionContext={{
                    sessionState,
                    digitalTwin: twin,
                    skillGap: twin?.gap,
                    roleMatches: verifiedMatches,
                    roadmap,
                    fairnessAudit: inclusion,
                    employerReadiness,
                    narrator,
                    resumeText,
                  }}
                />
              </div>
            </div>
          )}
        </>
      )}
      </div>
    </>
  )}

      {/* ==================================================================== */}
      {/* ROLE SWITCH COMPARISON MODAL                                          */}
      {/* ==================================================================== */}
      {compareRoleTarget && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-card border-2 border-hairline rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-hairline">
              <div className="flex items-center gap-2 text-brand-pink font-mono text-xs font-bold uppercase">
                <GitCompare className="w-4 h-4" /> Role Switch Deep Comparison
              </div>
              <button
                onClick={() => setCompareRoleTarget(null)}
                className="py-1 px-2.5 rounded-lg bg-surface-soft hover:bg-surface-strong text-muted text-xs font-mono font-bold"
              >
                Close
              </button>
            </div>

            {comparingLoading ? (
              <div className="py-12 text-center space-y-3">
                <div className="w-8 h-8 border-4 border-brand-pink border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs font-mono text-muted">Agent 12 analyzing skill overlap & feasibility...</p>
              </div>
            ) : comparisonData ? (
              <div className="space-y-4 text-xs font-medium">
                <div className="flex items-center justify-between p-4 rounded-2xl bg-surface-soft border border-hairline">
                  <div>
                    <h4 className="font-bold text-sm text-ink">{comparisonData.roleA} vs {comparisonData.roleB}</h4>
                    <span className="text-muted font-mono text-[11px]">Recommended: <strong className="text-brand-pink font-bold">{comparisonData.recommendation}</strong></span>
                  </div>
                  <span className="text-xs font-black font-mono text-brand-teal px-3 py-1 rounded-full bg-brand-teal/10 border border-brand-teal/30">
                    Winner: {comparisonData.winner?.toUpperCase()}
                  </span>
                </div>

                <div className="space-y-2">
                  <span className="text-muted block text-[10px] font-mono uppercase font-bold mb-1">5-Dimension Side-by-Side Analysis</span>
                  {comparisonData.dimensions.map((dim, i) => (
                    <div key={i} className="p-3 rounded-xl bg-surface-soft border border-hairline flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono">
                      <span className="font-bold text-ink">{dim.dimension}</span>
                      <div className="flex items-center gap-3 text-[11px]">
                        <span className="text-brand-pink">{dim.roleA}</span>
                        <span>vs</span>
                        <span className="text-brand-teal">{dim.roleB}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-4 rounded-2xl bg-surface-soft border border-hairline space-y-1">
                  <span className="text-[10px] font-mono text-muted uppercase font-bold">Strategic Market Recommendation</span>
                  <p className="text-body leading-relaxed">{comparisonData.reasonForRecommendation}</p>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {sessionState && (
        <>
          <SapHubExportModal
            isOpen={showSapExportModal}
            onClose={() => setShowSapExportModal(false)}
            sessionState={sessionState}
          />
          <FairnessCertificateModal
            isOpen={showFairnessModal}
            onClose={() => setShowFairnessModal(false)}
            sessionState={sessionState}
          />
        </>
      )}
    </div>
  );
}
