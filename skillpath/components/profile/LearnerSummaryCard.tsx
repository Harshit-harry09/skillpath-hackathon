'use client';

import React from 'react';
import { CheckCircle2, AlertTriangle, ArrowRight, Activity, Zap, Compass } from 'lucide-react';
import type { UserProfile } from '@/types/profile';
import type { ActiveJob, TrackedSkill } from '@/types/active-job';

export interface LearnerSummaryCardProps {
  profile: UserProfile;
  activeJob: ActiveJob | null;
  onOpenExport?: () => void;
}

export function LearnerSummaryCard({ profile, activeJob, onOpenExport }: LearnerSummaryCardProps) {
  const trackedSkills = activeJob?.skills || [];
  
  // 1. Completed Items
  const completedItems = trackedSkills.filter(s => s.state === 'learned');

  // 2. Weak Areas (Unlearned skills sorted by priority)
  const weakAreas = trackedSkills
    .filter(s => s.state === 'not_started' || s.state === 'in_progress')
    .sort((a, b) => b.priority - a.priority);

  // 3. Next Recommended Action
  const nextRecommendation = weakAreas.length > 0
    ? weakAreas[0]
    : null;

  // 4. Recent Activity
  const streakDays = profile.streak_count || 0;
  const lastActiveDate = profile.streak_last_date
    ? new Date(profile.streak_last_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : 'Recently active';

  return (
    <div className="bg-surface-card border border-hairline rounded-[32px] p-8 space-y-6 shadow-sm relative overflow-hidden">
      {/* Background Subtle Accent */}
      <div className="absolute top-0 right-0 w-72 h-72 bg-brand-pink/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-hairline/60 pb-5 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-ink text-on-primary flex items-center justify-center font-bold">
            <Compass size={20} />
          </div>
          <div>
            <h2 className="font-display text-title-md text-ink">Learner Executive Summary</h2>
            <p className="font-sans text-body-sm text-muted">Current progress, weak areas & next steps</p>
          </div>
        </div>

        {onOpenExport && (
          <button
            onClick={onOpenExport}
            className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-surface-soft hover:bg-surface-strong border border-hairline font-sans text-xs font-bold text-ink transition-all active:scale-95 cursor-pointer self-start sm:self-center"
          >
            <Zap size={14} className="text-brand-pink" />
            <span>Export Full Summary</span>
          </button>
        )}
      </div>

      {/* 4 Quadrants Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
        
        {/* 1. Completed Items */}
        <div className="p-5 rounded-2xl border border-hairline bg-surface-soft/40 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-brand-teal" />
              <span className="font-sans text-xs font-bold uppercase tracking-wider text-ink">
                Completed Items ({completedItems.length})
              </span>
            </div>
            <span className="font-mono text-[10px] font-bold text-brand-teal">
              {completedItems.length ? `${Math.round((completedItems.length / Math.max(1, trackedSkills.length)) * 100)}% Mastered` : '0%'}
            </span>
          </div>

          <div className="space-y-1.5 max-h-36 overflow-y-auto">
            {completedItems.length > 0 ? (
              completedItems.map(item => (
                <div key={item.skill} className="flex items-center justify-between text-xs py-1 px-2.5 rounded-lg bg-surface-card border border-hairline/50">
                  <span className="font-medium text-ink truncate">{item.skill}</span>
                  {item.note && <span className="font-mono text-[9px] text-muted italic ml-2 truncate max-w-[100px]">&ldquo;{item.note}&rdquo;</span>}
                </div>
              ))
            ) : (
              <p className="font-sans text-xs text-muted/60 italic py-2">No items completed yet. Mark skills as learned in your tracker.</p>
            )}
          </div>
        </div>

        {/* 2. Weak Areas */}
        <div className="p-5 rounded-2xl border border-hairline bg-surface-soft/40 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle size={16} className="text-brand-pink" />
              <span className="font-sans text-xs font-bold uppercase tracking-wider text-ink">
                Weak Areas ({weakAreas.length})
              </span>
            </div>
            <span className="font-mono text-[10px] font-bold text-brand-pink">
              Needs Priority
            </span>
          </div>

          <div className="space-y-1.5 max-h-36 overflow-y-auto">
            {weakAreas.length > 0 ? (
              weakAreas.slice(0, 4).map(item => (
                <div key={item.skill} className="flex items-center justify-between text-xs py-1 px-2.5 rounded-lg bg-surface-card border border-hairline/50">
                  <span className="font-medium text-ink truncate">{item.skill}</span>
                  <span className="font-mono text-[9px] font-bold text-brand-ochre shrink-0 ml-2">
                    {item.weeks_to_learn || 1}w gap
                  </span>
                </div>
              ))
            ) : (
              <p className="font-sans text-xs text-brand-teal font-semibold py-2">🎉 All target skill gaps resolved!</p>
            )}
          </div>
        </div>

        {/* 3. Next Recommended Action */}
        <div className="p-5 rounded-2xl border border-brand-teal/30 bg-brand-teal/5 space-y-2 col-span-1 md:col-span-2">
          <div className="flex items-center justify-between">
            <span className="font-sans text-[10px] font-bold uppercase tracking-widest text-brand-teal flex items-center gap-1.5">
              <ArrowRight size={13} />
              Next Recommended Action
            </span>
            {nextRecommendation && (
              <span className="font-mono text-[10px] font-bold text-ink">
                Est. {nextRecommendation.weeks_to_learn || 1} week focus
              </span>
            )}
          </div>

          {nextRecommendation ? (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
              <div>
                <p className="font-display text-title-xs text-ink">
                  Master <span className="text-brand-teal underline decoration-brand-teal/40 underline-offset-4">{nextRecommendation.skill}</span>
                </p>
                <p className="font-sans text-xs text-muted mt-0.5">
                  {nextRecommendation.reason || 'Highest priority skill gap required for target role readiness.'}
                </p>
              </div>
              <a
                href={`/results/${activeJob?.analysis_id}#skill-${nextRecommendation.skill.toLowerCase().replace(/\s+/g, '-')}`}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-ink text-on-primary font-sans text-xs font-bold shrink-0 hover:opacity-90 transition-opacity"
              >
                <span>Start Learning</span>
                <ArrowRight size={13} />
              </a>
            </div>
          ) : (
            <p className="font-sans text-xs text-muted pt-1">
              Pin an active target role or run a resume analysis to get tailored action recommendations.
            </p>
          )}
        </div>

        {/* 4. Recent Activity */}
        <div className="p-5 rounded-2xl border border-hairline bg-surface-soft/40 space-y-2 col-span-1 md:col-span-2">
          <div className="flex items-center justify-between">
            <span className="font-sans text-[10px] font-bold uppercase tracking-widest text-muted flex items-center gap-1.5">
              <Activity size={13} className="text-primary" />
              Recent Learner Activity
            </span>
            <span className="font-mono text-[10px] font-semibold text-muted">
              Last Active: {lastActiveDate}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
            <div className="p-3 rounded-xl bg-surface-card border border-hairline">
              <span className="block font-mono font-bold text-ink text-base">{streakDays} Days</span>
              <span className="block font-sans text-[10px] text-muted uppercase tracking-wider font-semibold">Active Streak</span>
            </div>
            <div className="p-3 rounded-xl bg-surface-card border border-hairline">
              <span className="block font-mono font-bold text-ink text-base">{profile.total_skills_learned || completedItems.length}</span>
              <span className="block font-sans text-[10px] text-muted uppercase tracking-wider font-semibold">Total Mastered</span>
            </div>
            <div className="p-3 rounded-xl bg-surface-card border border-hairline col-span-2 sm:col-span-1">
              <span className="block font-mono font-bold text-brand-teal text-base">{activeJob ? `${activeJob.readiness_score}%` : 'N/A'}</span>
              <span className="block font-sans text-[10px] text-muted uppercase tracking-wider font-semibold">Readiness Score</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
