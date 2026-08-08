'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldAlert,
  Wrench,
  MessageSquareText,
  LineChart,
  SpellCheck,
  Zap,
  Calculator,
  Sparkles,
  Check,
  ArrowRight,
  ChevronRight,
  Sliders,
  Download,
} from 'lucide-react';
import type { AnalysisResult, SkillGap } from '@/types/analysis';
import { computeFreshnessScore } from '@/lib/skill-expiry';

import { RecruiterRedFlagRadar } from '@/components/results/RecruiterRedFlagRadar';
import { JDSynonymMatcher } from '@/components/results/JDSynonymMatcher';
import { JargonTranslator } from '@/components/results/JargonTranslator';
import { ShowYourWorkScore } from '@/components/results/ShowYourWorkScore';

import { InlineDiffEditor } from '@/components/editor/InlineDiffEditor';
import { ResumeFlawCheckerModal } from '@/components/results/ResumeFlawCheckerModal';
import { DeslopifyModal } from '@/components/results/DeslopifyModal';
import { MetricDiscoveryModal } from '@/components/results/MetricDiscoveryModal';

import { StarBulletModal } from '@/components/results/StarBulletModal';
import { CoverLetterGenerator } from '@/components/results/CoverLetterGenerator';
import { LinkedInHeadlineOptimizer } from '@/components/results/LinkedInHeadlineOptimizer';

import { SalaryRoiCard } from '@/components/results/SalaryRoiCard';
import { FreshnessScoreCard } from '@/components/results/FreshnessScoreCard';
import { RoleSwitchPanel } from '@/components/results/RoleSwitchPanel';
import { CompetitiveBenchmarkScore } from '@/components/results/CompetitiveBenchmarkScore';
import { SeniorityCalibrator, type SeniorityLevel } from '@/components/results/SeniorityCalibrator';
import { MultiFormatExporter } from '@/components/results/MultiFormatExporter';

interface UnifiedToolkitProps {
  data: AnalysisResult;
  activeGaps: SkillGap[];
  freshnessResult: ReturnType<typeof computeFreshnessScore> | null;
  onSeniorityChange?: (level: SeniorityLevel) => void;
}

type TabKey = 'audit' | 'rewriter' | 'career' | 'market';

const TABS: Array<{ id: TabKey; label: string; icon: any; badge?: string }> = [
  { id: 'audit', label: 'ATS & Recruiter Audit', icon: ShieldAlert },
  { id: 'rewriter', label: 'AI Rewriter & Flaw Fixer', icon: Wrench },
  { id: 'career', label: 'STAR Bullets & Cover Letter', icon: MessageSquareText },
  { id: 'market', label: 'Market ROI & Exports', icon: LineChart },
];

export function UnifiedToolkit({
  data,
  activeGaps,
  freshnessResult,
  onSeniorityChange,
}: UnifiedToolkitProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('audit');
  const [showMetricModal, setShowMetricModal] = useState(false);
  const [showDeslopifyModal, setShowDeslopifyModal] = useState(false);
  const [showFlawModal, setShowFlawModal] = useState(false);
  const [starModalSkill, setStarModalSkill] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const topSkills = (data.matched_skills || data.mvc_skills || []).slice(0, 6);
  const sampleStarSkill = activeGaps[0]?.skill || topSkills[0] || 'System Architecture';

  return (
    <section id="more-tools" className="scroll-mt-28 space-y-6">
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-2xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 border border-hairline px-4 py-3 text-xs font-bold shadow-2xl animate-bounce">
          <Check size={16} className="text-brand-teal" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Modals */}
      <MetricDiscoveryModal
        isOpen={showMetricModal}
        onClose={() => setShowMetricModal(false)}
        onApplyMetric={() => showToast('Verified Metric Copied to Clipboard!')}
      />

      <DeslopifyModal
        isOpen={showDeslopifyModal}
        onClose={() => setShowDeslopifyModal(false)}
        resumeSkills={data.resume_skills || []}
        resumeText={data.resume_text || ''}
      />

      <ResumeFlawCheckerModal
        isOpen={showFlawModal}
        onClose={() => setShowFlawModal(false)}
        resumeText={data.resume_text || (data.resume_skills ? `Skills: ${data.resume_skills.join(', ')}` : '')}
        roleLabel={data.role_label || 'Software Engineer'}
      />

      <StarBulletModal
        isOpen={Boolean(starModalSkill)}
        onClose={() => setStarModalSkill(null)}
        skill={starModalSkill || ''}
        role={data.role_label || 'Software Engineer'}
      />

      {/* Main Unified Toolkit Card */}
      <div className="bg-surface-card border-2 border-hairline rounded-3xl p-6 md:p-8 shadow-sm relative overflow-hidden">
        {/* Card Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-hairline">
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-teal/10 border border-brand-teal/20 text-[10px] font-mono font-bold tracking-widest text-brand-teal uppercase mb-2">
              <Sparkles size={13} className="fill-current" />
              SkillPath AI Career Workspace
            </span>
            <h2 className="font-display text-title-lg text-ink tracking-tight">
              AI Career & Optimization Toolkit
            </h2>
            <p className="font-sans text-body-xs text-muted mt-1 leading-relaxed max-w-xl">
              All recruiter audits, AI rewriters, STAR bullets, and market forecasts in one unified workspace.
            </p>
          </div>
        </div>

        {/* Tab Navigation Pill Bar (Apple-style Segmented Control) */}
        <div className="mt-6 p-1.5 rounded-2xl bg-surface-soft/80 border border-hairline flex items-center gap-1.5 overflow-x-auto scrollbar-none relative">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <motion.button
                key={tab.id}
                type="button"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setActiveTab(tab.id)}
                className={`relative px-4 py-2.5 rounded-xl font-sans text-xs font-bold transition-colors flex items-center justify-center gap-2 shrink-0 cursor-pointer flex-1 min-w-[140px] ${
                  isActive ? 'text-on-primary' : 'text-muted hover:text-ink'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeTabPill"
                    className="absolute inset-0 bg-ink rounded-xl shadow-xs"
                    transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-2">
                  <Icon size={14} className={isActive ? 'text-brand-teal' : 'text-muted'} />
                  <span>{tab.label}</span>
                </span>
              </motion.button>
            );
          })}
        </div>

        {/* Tab Content Panels */}
        <div className="mt-6">
          <AnimatePresence mode="wait">
            {/* TAB 1: ATS & RECRUITER AUDIT */}
            {activeTab === 'audit' && (
              <motion.div
                key="tab-audit"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                <RecruiterRedFlagRadar data={data} />
                <JDSynonymMatcher data={data} />
                <JargonTranslator resumeSkills={data.resume_skills || []} />
                <ShowYourWorkScore data={data} />
              </motion.div>
            )}

            {/* TAB 2: AI REWRITER & FLAW FIXER */}
            {activeTab === 'rewriter' && (
              <motion.div
                key="tab-rewriter"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                {/* 1-Click AI Power Action Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  {/* Flaw Auditor Launcher */}
                  <motion.div
                    whileHover={{ y: -3 }}
                    className="rounded-2xl border border-brand-pink/30 bg-surface-soft/40 p-6 flex flex-col justify-between gap-5 transition-all hover:border-brand-pink/50 shadow-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <span className="p-2 rounded-xl bg-brand-pink/10 text-brand-pink border border-brand-pink/20">
                          <SpellCheck size={18} />
                        </span>
                        <h4 className="text-xs font-bold text-ink uppercase tracking-wider">Resume Flaw Auditor</h4>
                      </div>
                      <p className="text-xs text-muted leading-relaxed">
                        Detects typos, passive voice, missing metrics, and ATS recruiter red flags with 1-click fixes.
                      </p>
                    </div>
                    <motion.button
                      type="button"
                      whileTap={{ scale: 0.97 }}
                      onClick={() => setShowFlawModal(true)}
                      className="w-full flex items-center justify-center gap-2 rounded-xl bg-brand-pink text-white font-bold text-xs py-3 px-4 hover:bg-brand-pink/90 transition-all cursor-pointer shadow-xs"
                    >
                      <SpellCheck size={14} />
                      Audit Resume Flaws
                    </motion.button>
                  </motion.div>

                  {/* De-Slopifier Launcher */}
                  <motion.div
                    whileHover={{ y: -3 }}
                    className="rounded-2xl border border-emerald-500/30 bg-surface-soft/40 p-6 flex flex-col justify-between gap-5 transition-all hover:border-emerald-500/50 shadow-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          <Zap size={18} />
                        </span>
                        <h4 className="text-xs font-bold text-ink uppercase tracking-wider">AI Buzzword De-Slopifier</h4>
                      </div>
                      <p className="text-xs text-muted leading-relaxed">
                        Replaces passive buzzwords ("spearheaded", "responsible for") with active engineering verbs.
                      </p>
                    </div>
                    <motion.button
                      type="button"
                      whileTap={{ scale: 0.97 }}
                      onClick={() => setShowDeslopifyModal(true)}
                      className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 dark:bg-emerald-500 text-white dark:text-slate-950 font-bold text-xs py-3 px-4 hover:bg-emerald-500 dark:hover:bg-emerald-400 transition-all cursor-pointer shadow-xs"
                    >
                      <Sparkles size={14} />
                      De-Slopify Verbs
                    </motion.button>
                  </motion.div>

                  {/* Metric Uncover Launcher */}
                  <motion.div
                    whileHover={{ y: -3 }}
                    className="rounded-2xl border border-brand-teal/30 bg-surface-soft/40 p-6 flex flex-col justify-between gap-5 transition-all hover:border-brand-teal/50 shadow-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <span className="p-2 rounded-xl bg-brand-teal/10 text-brand-teal border border-brand-teal/20">
                          <Calculator size={18} />
                        </span>
                        <h4 className="text-xs font-bold text-ink uppercase tracking-wider">Interactive Metric Uncover</h4>
                      </div>
                      <p className="text-xs text-muted leading-relaxed">
                        Answer 2 quick questions to discover real metric impact without AI hallucinations.
                      </p>
                    </div>
                    <motion.button
                      type="button"
                      whileTap={{ scale: 0.97 }}
                      onClick={() => setShowMetricModal(true)}
                      className="w-full flex items-center justify-center gap-2 rounded-xl bg-brand-teal text-slate-950 font-bold text-xs py-3 px-4 hover:bg-brand-teal/90 transition-all cursor-pointer shadow-xs"
                    >
                      <Calculator size={14} />
                      Uncover Real Metrics
                    </motion.button>
                  </motion.div>
                </div>

                {/* Inline Diff Editor Workspace */}
                <InlineDiffEditor />
              </motion.div>
            )}

            {/* TAB 3: STAR BULLETS & COVER LETTER */}
            {activeTab === 'career' && (
              <motion.div
                key="tab-career"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                {/* STAR Bullet Launcher Banner */}
                <div className="rounded-2xl border border-brand-teal/30 bg-surface-soft/60 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
                  <div>
                    <h4 className="text-sm font-bold text-ink flex items-center gap-2">
                      <MessageSquareText size={18} className="text-brand-teal" />
                      STAR Interview Bullet Generator
                    </h4>
                    <p className="text-xs text-muted mt-1 leading-relaxed">
                      Architect ATS-optimized STAR bullet points for <strong className="text-ink font-semibold">{sampleStarSkill}</strong>.
                    </p>
                  </div>
                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setStarModalSkill(sampleStarSkill)}
                    className="shrink-0 flex items-center gap-2 rounded-xl bg-brand-teal px-5 py-3 text-xs font-bold text-slate-950 hover:bg-brand-teal/90 transition-all cursor-pointer shadow-xs"
                  >
                    Generate STAR Bullets <ArrowRight size={14} />
                  </motion.button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <CoverLetterGenerator
                    roleLabel={data.role_label || 'Software Engineer'}
                    topSkills={topSkills}
                  />
                  <LinkedInHeadlineOptimizer
                    roleLabel={data.role_label || 'Software Engineer'}
                    topSkills={topSkills}
                  />
                </div>
              </motion.div>
            )}

            {/* TAB 4: MARKET ROI & EXPORTS */}
            {activeTab === 'market' && (
              <motion.div
                key="tab-market"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                <SalaryRoiCard
                  roleCategory={data.role_category || ''}
                  roleLabel={data.role_label || 'Software Engineer'}
                  gapCount={activeGaps.length}
                  mvcSkills={data.mvc_skills || []}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {freshnessResult && <FreshnessScoreCard data={freshnessResult} />}
                  <CompetitiveBenchmarkScore
                    matchPct={data.gap_score || 0}
                    freshnessScore={freshnessResult?.score}
                    gapCount={activeGaps.length}
                    criticalCount={activeGaps.filter((gap) => gap.match_status === 'missing' || gap.in_mvc).length}
                  />
                </div>

                {data.role_category && (
                  <RoleSwitchPanel
                    resumeSkills={data.resume_skills || []}
                    resumeText=""
                    currentRoleSlug={data.role_category}
                    currentRoleLabel={data.role_label || 'Software Engineer'}
                  />
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <SeniorityCalibrator onLevelChange={onSeniorityChange} />
                  <MultiFormatExporter data={data} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
