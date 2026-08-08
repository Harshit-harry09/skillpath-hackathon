'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Sparkles, Upload, Share2, BookmarkCheck, Bookmark, Zap, Filter } from 'lucide-react';
import { ReadinessRing } from '@/components/results/ReadinessRing';
import { PinJobButton } from '@/components/results/PinJobButton';
import type { AnalysisResult, SkillGap } from '@/types/analysis';
import type { ActiveJob } from '@/types/active-job';

interface SidebarScorecardProps {
  data: AnalysisResult;
  gapScore: number;
  readinessScore: number;
  activeGaps: SkillGap[];
  requirementSummary: {
    total: number;
    matched: number;
    partial: number;
    transferable: number;
    missing: number;
    review: number;
  };
  /** Role-filtered version of requirementSummary — used for score breakdown when a role tab is active */
  filteredRequirementSummary?: {
    total: number;
    matched: number;
    partial: number;
    transferable: number;
    missing: number;
    review: number;
  };
  readyDate: string;
  saved: boolean;
  onSave: () => void;
  onShare: () => void;
  onRateSkills: () => void;
  /** Whether this analysis is already pinned as an active job */
  isPinned?: boolean;
  /** Called with the freshly-created ActiveJob when the user pins this job */
  onPinned?: (job: ActiveJob) => void;
  /** The currently-selected role filter tab (used to show a filter badge) */
  selectedRole?: string;
  /** Optional resume skills list to store on active job */
  resumeSkills?: string[];
}

export function SidebarScorecard({
  data,
  gapScore,
  readinessScore,
  activeGaps,
  requirementSummary,
  filteredRequirementSummary,
  readyDate,
  saved,
  onSave,
  onShare,
  onRateSkills,
  isPinned = false,
  onPinned,
  selectedRole,
  resumeSkills = [],
}: SidebarScorecardProps) {
  // Use role-filtered summary for score breakdown when a role tab is active
  const activeSummary = (filteredRequirementSummary && selectedRole && selectedRole !== 'all')
    ? filteredRequirementSummary
    : requirementSummary;
  const router = useRouter();

  // Compute issue counts for each category based on real data
  const formattingIssueCount = data.fraud_audit?.formatting_issues?.length || 0;
  const redFlagCount = (data.fraud_audit?.fraud_flags?.length || 0) + (data.fraud_audit?.hidden_text_detected ? 1 : 0);
  const hardSkillIssues = activeSummary.missing + activeGaps.filter((g) => g.in_mvc).length;
  const softSkillIssues = activeSummary.partial + activeSummary.transferable;
  const searchabilityIssues = (data.evidence?.length === 0 ? 1 : 0) + (data.fraud_audit?.hidden_text_detected ? 1 : 0);

  // Progress percentages
  const searchabilityPct = data.evidence?.length ? Math.min(100, Math.max(30, Math.round((data.evidence.length / Math.max(1, activeSummary.total)) * 100))) : 40;
  const hardSkillsPct = activeSummary.total > 0 ? Math.round((activeSummary.matched / activeSummary.total) * 100) : 35;
  const softSkillsPct = activeSummary.total > 0 ? Math.round(((activeSummary.matched + activeSummary.transferable) / activeSummary.total) * 100) : 70;
  const recruiterTipsPct = Math.max(15, 100 - redFlagCount * 25);
  const formattingPct = formattingIssueCount === 0 ? 100 : Math.max(25, 100 - formattingIssueCount * 30);
  const isRoleFiltered = Boolean(selectedRole && selectedRole !== 'all');

  const ringColor = gapScore >= 70 ? '#2DD4BF' : gapScore >= 45 ? '#e8b94a' : '#ff4d8b';

  const scrollToRoadmap = () => {
    document.getElementById('learning-roadmap')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="w-full space-y-4">
      {/* Top ATS Match Scorecard Panel */}
      <div className="bg-surface-card border-2 border-hairline rounded-3xl p-6 shadow-sm relative overflow-hidden">
        {/* Decorative Top Pill */}
        <div className="flex items-center justify-between mb-4">
          <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted flex items-center gap-1.5">
            <Zap size={13} className="text-brand-pink" />
            SkillPath AI Match Engine
          </span>
          <div className="flex items-center gap-1.5">
            {isRoleFiltered && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-[9px] font-bold font-mono text-primary uppercase">
                <Filter size={8} />
                {selectedRole}
              </span>
            )}
            <span className="px-2 py-0.5 rounded-full bg-surface-soft border border-hairline text-[9px] font-bold font-mono text-muted uppercase">
              {data.role_label || 'Target Role'}
            </span>
          </div>
        </div>

        {/* Big Circular Match Rate Gauge */}
        <div className="flex flex-col items-center justify-center my-4">
          <h2 className="font-display text-2xl font-bold text-ink mb-3 tracking-tight">
            Match Rate
          </h2>

          <div className="relative p-2 rounded-full bg-surface-soft/40 border border-hairline">
            <ReadinessRing
              score={gapScore}
              size={148}
              strokeWidth={10}
              color={ringColor}
            />
          </div>

          <span className="font-sans text-xs text-muted font-medium mt-3 text-center">
            {gapScore >= 70
              ? 'Strong resume coverage for this position'
              : gapScore >= 45
              ? 'Moderate match — key skill gaps detected'
              : 'Low match — requires target skill optimizations'}
          </span>
        </div>

        {/* Primary Action Buttons */}
        <div className="space-y-2.5 mt-6 pt-5 border-t border-hairline">
          {/* Track This Job — most prominent CTA */}
          {onPinned && (
            <PinJobButton
              analysisId={data.share_token}
              jobTitle={data.role_label || 'Target Role'}
              companyType={data.company_type || 'startup'}
              role={data.role_label || ''}
              seniority="senior"
              skillGaps={data.skill_gaps || []}
              resumeSkills={resumeSkills}
              readinessScore={gapScore}
              isPinned={isPinned}
              onPinned={onPinned}
              variant="sidebar"
            />
          )}

          <motion.button
            type="button"
            whileTap={{ scale: 0.97 }}
            onClick={() => router.push('/analyze')}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-brand-pink text-white font-black text-xs uppercase tracking-wider border-2 border-bold-border shadow-[3px_3px_0_var(--bold-border)] hover:-translate-y-0.5 hover:shadow-[4px_4px_0_var(--bold-border)] active:translate-y-0.5 transition-all cursor-pointer"
          >
            <Upload size={14} />
            Upload & rescan
          </motion.button>

          <motion.button
            type="button"
            whileTap={{ scale: 0.97 }}
            onClick={scrollToRoadmap}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-brand-teal/10 hover:bg-brand-teal/20 text-brand-teal border border-brand-teal/30 font-bold text-xs uppercase tracking-wider transition-all cursor-pointer"
          >
            <Sparkles size={14} className="fill-current" />
            AI Optimize Roadmap
          </motion.button>
        </div>

        {/* Sub-Score Progress Bars ("Issues to Fix") */}
        <div className="mt-7 pt-6 border-t border-hairline space-y-4">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted flex items-center gap-1.5">
              Score Breakdown
              {isRoleFiltered && <span className="text-primary">({selectedRole})</span>}
            </span>
            <span className="text-[10px] font-mono font-bold text-brand-pink uppercase">
              {hardSkillIssues + softSkillIssues + redFlagCount + formattingIssueCount} issues total
            </span>
          </div>

          {/* 1. Searchability */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs font-bold">
              <span className="text-ink">Searchability & Evidence</span>
              <span className={searchabilityIssues > 0 ? 'text-brand-pink font-mono text-[11px]' : 'text-brand-teal font-mono text-[11px]'}>
                {searchabilityIssues > 0 ? `${searchabilityIssues} issues to fix` : 'Clean'}
              </span>
            </div>
            <div className="h-2 rounded-full bg-surface-soft overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700 bg-brand-teal"
                style={{ width: `${searchabilityPct}%` }}
              />
            </div>
          </div>

          {/* 2. Hard Skills */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs font-bold">
              <span className="text-ink">Hard Skills</span>
              <span className={hardSkillIssues > 0 ? 'text-rose-500 font-mono text-[11px]' : 'text-brand-teal font-mono text-[11px]'}>
                {hardSkillIssues > 0 ? `${hardSkillIssues} issues to fix` : 'Matched'}
              </span>
            </div>
            <div className="h-2 rounded-full bg-surface-soft overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${hardSkillIssues > 3 ? 'bg-rose-500' : 'bg-brand-teal'}`}
                style={{ width: `${hardSkillsPct}%` }}
              />
            </div>
          </div>

          {/* 3. Soft & Transferable Skills */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs font-bold">
              <span className="text-ink">Soft & Transferable Skills</span>
              <span className={softSkillIssues > 0 ? 'text-amber-500 font-mono text-[11px]' : 'text-brand-teal font-mono text-[11px]'}>
                {softSkillIssues > 0 ? `${softSkillIssues} issues to fix` : 'Strong'}
              </span>
            </div>
            <div className="h-2 rounded-full bg-surface-soft overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700 bg-indigo-500"
                style={{ width: `${softSkillsPct}%` }}
              />
            </div>
          </div>

          {/* 4. Recruiter Tips & Flags */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs font-bold">
              <span className="text-ink">Recruiter Radar Tips</span>
              <span className={redFlagCount > 0 ? 'text-brand-pink font-mono text-[11px]' : 'text-brand-teal font-mono text-[11px]'}>
                {redFlagCount > 0 ? `${redFlagCount} issues to fix` : 'Clean'}
              </span>
            </div>
            <div className="h-2 rounded-full bg-surface-soft overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700 bg-brand-pink"
                style={{ width: `${recruiterTipsPct}%` }}
              />
            </div>
          </div>

          {/* 5. Formatting */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs font-bold">
              <span className="text-ink">Formatting & ATS Parsing</span>
              <span className={formattingIssueCount > 0 ? 'text-brand-pink font-mono text-[11px]' : 'text-brand-teal font-mono text-[11px]'}>
                {formattingIssueCount > 0 ? `${formattingIssueCount} issues to fix` : 'Clean'}
              </span>
            </div>
            <div className="h-2 rounded-full bg-surface-soft overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700 bg-brand-teal"
                style={{ width: `${formattingPct}%` }}
              />
            </div>
          </div>
        </div>

        {/* Secondary Quick Action Bar */}
        <div className="mt-6 pt-5 border-t border-hairline grid grid-cols-2 gap-2">
          <motion.button
            type="button"
            whileTap={{ scale: 0.96 }}
            onClick={onSave}
            disabled={saved}
            className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              saved
                ? 'bg-brand-teal/10 border-brand-teal/30 text-brand-teal'
                : 'bg-surface-soft border-hairline text-ink hover:bg-surface-strong'
            }`}
          >
            {saved ? <BookmarkCheck size={14} /> : <Bookmark size={14} />}
            {saved ? 'Saved' : 'Save Path'}
          </motion.button>

          <motion.button
            type="button"
            whileTap={{ scale: 0.96 }}
            onClick={onShare}
            className="py-2 px-3 rounded-xl bg-surface-soft border border-hairline text-xs font-bold text-ink hover:bg-surface-strong flex items-center justify-center gap-1.5 transition-all cursor-pointer"
          >
            <Share2 size={14} />
            Share
          </motion.button>
        </div>
      </div>

      {/* Mini Stats Summary Pill Card */}
      <div className="bg-surface-card border border-hairline rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between text-xs font-bold">
          <span className="text-muted uppercase tracking-wider font-mono text-[10px]">Readiness Score</span>
          <span className="text-ink font-mono">{readinessScore}/100</span>
        </div>
        <div className="flex items-center justify-between text-xs font-bold">
          <span className="text-muted uppercase tracking-wider font-mono text-[10px]">Estimated Ready Date</span>
          <span className="text-brand-teal font-mono">{readyDate}</span>
        </div>
        <motion.button
          type="button"
          whileTap={{ scale: 0.97 }}
          onClick={onRateSkills}
          className="w-full py-2 rounded-xl bg-surface-soft hover:bg-surface-strong border border-hairline text-[11px] font-bold text-ink transition-colors cursor-pointer"
        >
          Rate My Skills & Adjust Score
        </motion.button>
      </div>
    </div>
  );
}
