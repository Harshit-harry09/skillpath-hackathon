'use client';

import { useState } from 'react';
import { ChevronDown, FileText, LineChart, Link2, MessageSquareText, Wrench, Sparkles, Zap, Calculator, Check, ArrowRight, SpellCheck } from 'lucide-react';
import type { AnalysisResult, SkillGap } from '@/types/analysis';
import { CoverLetterGenerator } from '@/components/results/CoverLetterGenerator';
import { LinkedInHeadlineOptimizer } from '@/components/results/LinkedInHeadlineOptimizer';
import { SalaryRoiCard } from '@/components/results/SalaryRoiCard';
import { FreshnessScoreCard } from '@/components/results/FreshnessScoreCard';
import { RoleSwitchPanel } from '@/components/results/RoleSwitchPanel';
import { CompetitiveBenchmarkScore } from '@/components/results/CompetitiveBenchmarkScore';
import { MetricDiscoveryModal } from '@/components/results/MetricDiscoveryModal';
import { StarBulletModal } from '@/components/results/StarBulletModal';
import { DeslopifyModal } from '@/components/results/DeslopifyModal';
import { ResumeFlawCheckerModal } from '@/components/results/ResumeFlawCheckerModal';
import { computeFreshnessScore } from '@/lib/skill-expiry';

interface SecondaryToolsProps {
  data: AnalysisResult;
  activeGaps: SkillGap[];
  freshnessResult: ReturnType<typeof computeFreshnessScore> | null;
}

type PanelKey = 'resume' | 'career' | 'market';

const panelMeta: Record<PanelKey, { label: string; description: string; icon: typeof Wrench }> = {
  resume: {
    label: 'Resume quality & De-Slopifier',
    description: 'AI Grammar & Flaw Audit, Buzzword De-Slopifier, and Metric Uncover.',
    icon: FileText,
  },
  career: {
    label: 'Career content & STAR bullets',
    description: 'Cover letter, LinkedIn headline, and STAR bullet generators.',
    icon: Link2,
  },
  market: {
    label: 'Market & trajectory simulations',
    description: 'Salary ROI estimates, skill freshness, and competitive benchmarks.',
    icon: LineChart,
  },
};

export function SecondaryTools({ data, activeGaps, freshnessResult }: SecondaryToolsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activePanel, setActivePanel] = useState<PanelKey | null>(null);
  const [showMetricModal, setShowMetricModal] = useState(false);
  const [showDeslopifyModal, setShowDeslopifyModal] = useState(false);
  const [showFlawModal, setShowFlawModal] = useState(false);
  const [starModalSkill, setStarModalSkill] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const togglePanel = (panel: PanelKey) => {
    setIsOpen(true);
    setActivePanel((current) => current === panel ? null : panel);
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const topSkills = (data.matched_skills || data.mvc_skills || []).slice(0, 6);
  const sampleStarSkill = activeGaps[0]?.skill || topSkills[0] || 'System Architecture';

  return (
    <section id="career-tools" className="scroll-mt-28 border-t border-hairline pt-4">
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-2xl bg-emerald-950 border border-emerald-500/40 px-4 py-3 text-xs font-bold text-emerald-300 shadow-2xl animate-bounce">
          <Check size={16} className="text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Metric Discovery Modal */}
      <MetricDiscoveryModal
        isOpen={showMetricModal}
        onClose={() => setShowMetricModal(false)}
        onApplyMetric={(metric) => showToast('Verified Metric Copied to Clipboard!')}
      />

      {/* De-Slopifier Modal */}
      <DeslopifyModal
        isOpen={showDeslopifyModal}
        onClose={() => setShowDeslopifyModal(false)}
        resumeSkills={data.resume_skills || []}
        resumeText={data.resume_text || ''}
      />

      {/* Resume Flaw & Grammar Auditor Modal */}
      <ResumeFlawCheckerModal
        isOpen={showFlawModal}
        onClose={() => setShowFlawModal(false)}
        resumeText={data.resume_text || (data.resume_skills ? `Skills: ${data.resume_skills.join(', ')}` : '')}
        roleLabel={data.role_label || 'Software Engineer'}
      />

      {/* STAR Bullet Modal */}
      <StarBulletModal
        isOpen={Boolean(starModalSkill)}
        onClose={() => setStarModalSkill(null)}
        skill={starModalSkill || ''}
        role={data.role_label || 'Software Engineer'}
      />

      {/* Accordion Toggle Header */}
      <button
        type="button"
        onClick={() => setIsOpen((value) => !value)}
        aria-expanded={isOpen}
        className="w-full min-h-12 flex items-center justify-between gap-4 rounded-2xl border border-hairline bg-surface-card px-5 py-4 text-left shadow-sm transition-colors hover:bg-surface-soft active:scale-[0.99]"
      >
        <span className="flex items-center gap-3 min-w-0">
          <span className="w-9 h-9 rounded-xl bg-surface-soft flex items-center justify-center text-brand-teal shrink-0 border border-hairline">
            <Wrench size={16} />
          </span>
          <span className="min-w-0">
            <span className="block font-display text-title-md text-ink">More tools, when you need them</span>
            <span className="block font-sans text-body-xs text-muted truncate">Resume fixes, career content, market context, and export options</span>
          </span>
        </span>
        <ChevronDown size={18} className={`text-muted shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="mt-4 space-y-3">
          {(Object.keys(panelMeta) as PanelKey[]).map((panel) => {
            const meta = panelMeta[panel];
            const Icon = meta.icon;
            const expanded = activePanel === panel;
            return (
              <div key={panel} className="rounded-2xl border border-hairline bg-surface-card overflow-hidden transition-all">
                <button
                  type="button"
                  onClick={() => togglePanel(panel)}
                  aria-expanded={expanded}
                  className="w-full min-h-12 flex items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-surface-soft"
                >
                  <span className="flex items-center gap-3 min-w-0">
                    <Icon size={16} className="text-brand-teal shrink-0" />
                    <span className="min-w-0">
                      <span className="block font-sans text-body-sm font-semibold text-ink">{meta.label}</span>
                      <span className="block font-sans text-body-xs text-muted truncate">{meta.description}</span>
                    </span>
                  </span>
                  <ChevronDown size={16} className={`text-muted shrink-0 transition-transform ${expanded ? 'rotate-180' : ''}`} />
                </button>

                {/* Panel 1: Resume Quality & De-Slopifier */}
                {expanded && panel === 'resume' && (
                  <div className="border-t border-hairline px-5 py-5 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">

                      {/* NEW: AI Resume Flaw & Grammar Auditor Card */}
                      <div className="rounded-xl border border-brand-pink/30 bg-brand-pink/5 p-4 flex flex-col justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1.5">
                            <span className="p-1.5 rounded-lg bg-brand-pink/10 text-brand-pink border border-brand-pink/20">
                              <SpellCheck size={14} />
                            </span>
                            <span className="text-xs font-bold text-ink">AI Resume Flaw & Grammar Auditor</span>
                          </div>
                          <p className="text-[11px] text-muted leading-relaxed">
                            Detects typos, passive voice, missing metrics, and ATS recruiter red flags with 1-click fixes.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowFlawModal(true)}
                          className="w-full flex items-center justify-center gap-2 rounded-lg bg-brand-pink/15 border border-brand-pink/30 px-3 py-2 text-xs font-bold text-brand-pink hover:bg-brand-pink/25 transition-colors"
                        >
                          <SpellCheck size={14} />
                          <span>Audit Resume Flaws</span>
                        </button>
                      </div>

                      {/* AI Buzzword De-Slopifier Card */}
                      <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 flex flex-col justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1.5">
                            <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              <Zap size={14} />
                            </span>
                            <span className="text-xs font-bold text-ink">1-Click AI Buzzword De-Slopifier</span>
                          </div>
                          <p className="text-[11px] text-muted leading-relaxed">
                            Replaces passive buzzwords ("spearheaded", "orchestrated") with active engineering verbs.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowDeslopifyModal(true)}
                          className="w-full flex items-center justify-center gap-2 rounded-lg bg-emerald-500/15 border border-emerald-500/30 px-3 py-2 text-xs font-bold text-emerald-300 hover:bg-emerald-500/25 transition-colors"
                        >
                          <Sparkles size={14} />
                          <span>De-Slopify Bullet Verbs</span>
                        </button>
                      </div>

                      {/* Metric Uncover Launcher Card */}
                      <div className="rounded-xl border border-hairline bg-surface-soft p-4 flex flex-col justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1.5">
                            <span className="p-1.5 rounded-lg bg-brand-teal/10 text-brand-teal border border-brand-teal/20">
                              <Calculator size={14} />
                            </span>
                            <span className="text-xs font-bold text-ink">Interactive Metric Uncover</span>
                          </div>
                          <p className="text-[11px] text-muted leading-relaxed">
                            Answer 2 quick questions to discover real metric impact without AI hallucinations.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowMetricModal(true)}
                          className="w-full flex items-center justify-center gap-2 rounded-lg bg-brand-teal/15 border border-brand-teal/30 px-3 py-2 text-xs font-bold text-brand-teal hover:bg-brand-teal/25 transition-colors"
                        >
                          <Calculator size={14} />
                          <span>Uncover Real Metrics</span>
                        </button>
                      </div>

                    </div>
                  </div>
                )}

                {/* Panel 2: Career Content & STAR Bullets */}
                {expanded && panel === 'career' && (
                  <div className="border-t border-hairline px-5 py-5 space-y-5">
                    {/* STAR Bullet Generator Launcher */}
                    <div className="rounded-xl border border-brand-teal/30 bg-brand-teal/5 p-4 flex items-center justify-between gap-4">
                      <div>
                        <h4 className="text-xs font-bold text-ink flex items-center gap-2">
                          <MessageSquareText size={14} className="text-brand-teal" />
                          STAR Interview Bullet Generator
                        </h4>
                        <p className="text-[11px] text-muted mt-0.5">
                          Architect ATS-optimized bullet points for <strong className="text-ink">{sampleStarSkill}</strong>.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setStarModalSkill(sampleStarSkill)}
                        className="shrink-0 flex items-center gap-1.5 rounded-lg bg-brand-teal px-3 py-2 text-xs font-bold text-on-primary hover:bg-primary-active transition-colors"
                      >
                        Generate STAR Bullets <ArrowRight size={13} />
                      </button>
                    </div>

                    <CoverLetterGenerator
                      roleLabel={data.role_label || 'Software Engineer'}
                      topSkills={topSkills}
                    />
                    <LinkedInHeadlineOptimizer
                      roleLabel={data.role_label || 'Software Engineer'}
                      topSkills={topSkills}
                    />
                  </div>
                )}

                {/* Panel 3: Market & Trajectory */}
                {expanded && panel === 'market' && (
                  <div className="border-t border-hairline px-5 py-5 space-y-6">
                    <SalaryRoiCard
                      roleCategory={data.role_category || ''}
                      roleLabel={data.role_label || 'Software Engineer'}
                      gapCount={activeGaps.length}
                      mvcSkills={data.mvc_skills || []}
                    />
                    {freshnessResult && <FreshnessScoreCard data={freshnessResult} />}
                    {data.role_category && (
                      <RoleSwitchPanel
                        resumeSkills={data.resume_skills || []}
                        resumeText=""
                        currentRoleSlug={data.role_category}
                        currentRoleLabel={data.role_label || 'Software Engineer'}
                      />
                    )}
                    <CompetitiveBenchmarkScore
                      matchPct={data.gap_score || 0}
                      freshnessScore={freshnessResult?.score}
                      gapCount={activeGaps.length}
                      criticalCount={activeGaps.filter((gap) => gap.match_status === 'missing' || gap.in_mvc).length}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
