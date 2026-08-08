'use client';
// updated

import React, { useState } from 'react';
import {
  Play, Sparkles, CheckCircle2, AlertCircle,
  ChevronDown, Clock, RotateCcw, Layers, Zap,
  DollarSign, FileText, Save, Check, Shield, User, UserCheck, Stethoscope, Search, FileCheck,
  ThumbsUp, ThumbsDown, PlusCircle, BookOpen
} from 'lucide-react';
import { motion, AnimatePresence, MotionConfig } from 'framer-motion';
import { ResourceCard } from './ResourceCard';
import { ConfidenceStrip } from './ConfidenceStrip';
import type { LucideIcon } from 'lucide-react';
import type { SkillGap, Resource, SkillResources, ConfidenceLevel } from '@/types/analysis';
import type { SkillState, AppRole } from '@/types/active-job';

interface SkillCardProps {
  gap: SkillGap;
  index: number;
  analysisId: string;
  role: string;
  seniority: string;
  companyType: string;
  initialResources?: SkillResources | Resource[];
  autoGenerate?: boolean;
  // Tracking & Note integration
  trackingState?: SkillState;
  onTrackingChange?: (skill: string, state: SkillState, note?: string) => Promise<void>;
  trackingColor?: string;
  colorVariant?: string;
  // Confidence self-assessment
  confidenceLevel?: ConfidenceLevel;
  onConfidenceChange?: (skill: string, level: ConfidenceLevel) => void;
  onResumeAction?: () => void;
}

type Status = 'idle' | 'loading' | 'done' | 'error';

const statusConfig: Record<Status, { accent: string; border: string; bg: string }> = {
  idle: { accent: 'bg-muted/40', border: 'border-hairline', bg: 'bg-surface-card' },
  loading: { accent: 'bg-primary', border: 'border-primary/20', bg: 'bg-surface-soft' },
  done: { accent: 'bg-brand-teal', border: 'border-hairline', bg: 'bg-surface-card' },
  error: { accent: 'bg-brand-pink', border: 'border-brand-pink/20', bg: 'bg-brand-pink/5' },
};

const LEVELS = ['Basic', 'Intermediate', 'Advanced', 'Expert'] as const;

const ROLE_BADGES: Record<AppRole, { label: string; icon: LucideIcon; color: string }> = {
  user: { label: 'User', icon: User, color: 'text-brand-pink bg-brand-pink/10 border-brand-pink/20' },
  admin: { label: 'Admin', icon: UserCheck, color: 'text-primary bg-primary/10 border-primary/20' },
  authority: { label: 'Authority', icon: Shield, color: 'text-brand-purple bg-brand-purple/10 border-brand-purple/20' },
  hospital: { label: 'Hospital', icon: Stethoscope, color: 'text-brand-teal bg-brand-teal/10 border-brand-teal/20' },
  investigator: { label: 'Investigator', icon: Search, color: 'text-brand-ochre bg-brand-ochre/10 border-brand-ochre/20' },
  reviewer: { label: 'Reviewer', icon: FileCheck, color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' },
};

const PriorityDots = ({ priority }: { priority: number }) => {
  const lit = Math.max(1, 6 - priority);
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className={`w-1.5 h-1.5 rounded-full transition-colors ${i < lit ? 'bg-ink' : 'bg-muted/20'}`} />
      ))}
    </div>
  );
};

const slide: any = {
  hidden: { opacity: 0, height: 0 },
  visible: { opacity: 1, height: 'auto', transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] as any } },
  exit: { opacity: 0, height: 0, transition: { duration: 0.25, ease: [0.16, 1, 0.3, 1] as any } },
};

const SkillCardComponent: React.FC<SkillCardProps> = ({
  gap, index, analysisId, role, seniority, companyType,
  initialResources, autoGenerate = false,
  trackingState = 'not_started', onTrackingChange, trackingColor,
  confidenceLevel, onConfidenceChange, onResumeAction
}) => {
  const [status, setStatus] = useState<Status>(initialResources ? 'done' : 'idle');
  const [skillResources, setSkillResources] = useState<SkillResources | null>(() => {
    if (!initialResources) return null;
    if (Array.isArray(initialResources)) return {
      focus_summary: `Mastering ${gap.skill} is a high-leverage move for ${role} roles.`,
      estimated_weeks: gap.weeks_to_learn,
      resources: initialResources,
    };
    return initialResources;
  });
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [clickCount, setClickCount] = useState(() =>
    skillResources ? Math.floor(skillResources.resources.length / 4) : 0
  );

  // Reflection note state
  const [showNoteBox, setShowNoteBox] = useState(Boolean(gap.note));
  const [noteText, setNoteText] = useState(gap.note || '');
  const [savingNote, setSavingNote] = useState(false);
  const [savedNoteSuccess, setSavedNoteSuccess] = useState(false);

  const [feedbackSent, setFeedbackSent] = useState<boolean | null>(null);

  const level = LEVELS[Math.min(clickCount, 3)];
  const cfg = statusConfig[status];
  const roleBadge = gap.role_category ? ROLE_BADGES[gap.role_category] : null;

  const sendAccuracyFeedback = async (accurate: boolean) => {
    if (feedbackSent !== null) return;
    setFeedbackSent(accurate);
    try {
      await fetch(`/api/results/${analysisId}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skill: gap.skill, accurate }),
      });
    } catch {
      // Non-critical — fire and forget
    }
  };

  const generate = async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (status === 'loading') return;
    const nextCount = clickCount + 1;
    setClickCount(nextCount);
    setStatus('loading');
    setError(null);
    try {
      const res = await fetch('/api/generate-resources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          analysis_id: analysisId,
          skill: gap.skill,
          role, seniority,
          company_type: companyType,
          existing_urls: skillResources?.resources.map(r => r.url) ?? [],
          click_count: nextCount,
        }),
      });
      if (!res.ok) throw new Error('Generation failed');

      const data = await res.json();
      setSkillResources(prev => {
        if (!prev) return data.skill_resources;
        const seen = new Set(prev.resources.map(r => r.url));
        return {
          ...data.skill_resources,
          resources: [
            ...prev.resources,
            ...data.skill_resources.resources.filter((r: Resource) => !seen.has(r.url)),
          ],
        };
      });
      setStatus('done');
      if (!isExpanded) setIsExpanded(true);
    } catch (err) {
      console.error('Skill generation error:', err);
      setError(err instanceof Error ? err.message : 'Connection failed');
      setStatus('error');
    }
  };

  React.useEffect(() => {
    if (autoGenerate && status === 'idle' && !initialResources) generate();
  }, [autoGenerate]);

  const handleStateChange = async (newState: SkillState) => {
    if (!onTrackingChange) return;
    await onTrackingChange(gap.skill, newState, noteText);
  };

  const handleSaveNote = async () => {
    if (!onTrackingChange) return;
    setSavingNote(true);
    try {
      await onTrackingChange(gap.skill, trackingState, noteText);
      setSavedNoteSuccess(true);
      setTimeout(() => setSavedNoteSuccess(false), 2000);
    } finally {
      setSavingNote(false);
    }
  };

  return (
    <MotionConfig reducedMotion="user">
      <div className={`relative rounded-xl border overflow-hidden transition-all duration-300 tactile-card ${cfg.bg} ${cfg.border}`}>

        {/* Left accent bar */}
        <div className={`absolute left-0 top-0 bottom-0 w-1 ${cfg.accent} transition-colors duration-300`} />

        {/* ── Main content ──────────────────────────────────────── */}
        <div className="px-5 md:px-8 py-6 md:py-7">

          {/* Header: grid */}
          <div className="flex gap-4 md:gap-6 items-start">

            {/* Tracking State Selector */}
            <div className="pt-1 flex flex-col items-center gap-1.5 shrink-0">
              <div className="flex items-center gap-1 bg-surface-soft p-1 rounded-full border border-hairline">
                <button
                  onClick={() => handleStateChange('not_started')}
                  className={[
                    'px-2 py-1 rounded-full font-mono text-[9px] font-bold uppercase transition-all',
                    trackingState === 'not_started'
                      ? 'bg-muted/20 text-ink shadow-xs'
                      : 'text-muted hover:text-ink',
                  ].join(' ')}
                  title="Mark Not Started"
                >
                  NS
                </button>
                <button
                  onClick={() => handleStateChange('in_progress')}
                  className={[
                    'px-2 py-1 rounded-full font-mono text-[9px] font-bold uppercase transition-all',
                    trackingState === 'in_progress'
                      ? 'bg-primary text-on-primary shadow-xs'
                      : 'text-muted hover:text-ink',
                  ].join(' ')}
                  title="Mark In Progress"
                >
                  IP
                </button>
                <button
                  onClick={() => handleStateChange('learned')}
                  className={[
                    'px-2 py-1 rounded-full font-mono text-[9px] font-bold uppercase transition-all',
                    trackingState === 'learned'
                      ? 'bg-brand-teal text-on-primary shadow-xs'
                      : 'text-muted hover:text-ink',
                  ].join(' ')}
                  title="Mark Completed"
                >
                  CP
                </button>
              </div>
              <span className="font-mono text-[8px] text-muted uppercase tracking-wider font-bold">
                {trackingState === 'learned' ? 'Completed' : trackingState === 'in_progress' ? 'In Progress' : 'Not Started'}
              </span>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="font-mono text-[11px] text-muted font-bold tracking-widest">
                  #{String(index + 1).padStart(2, '0')}
                </span>
                {gap.in_mvc && (
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-sm bg-brand-teal/10 border border-brand-teal/20 text-[9px] text-brand-teal font-bold tracking-widest uppercase">
                    <Zap size={8} className="fill-current" />
                    MVC
                  </span>
                )}
                {/* Feature 2: Role Badge */}
                {roleBadge && (
                  <span className={`flex items-center gap-1 px-2 py-0.5 rounded-sm border text-[9px] font-bold tracking-widest uppercase ${roleBadge.color}`}>
                    <roleBadge.icon size={9} />
                    {roleBadge.label}
                  </span>
                )}
                {/* Salary ROI Badge */}
                {gap.premium && gap.premium > 0 && (
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-sm bg-brand-ochre/10 border border-brand-ochre/20 text-[9px] text-brand-ochre font-bold tracking-widest uppercase">
                    <DollarSign size={8} />
                    +${Math.round(gap.premium / 1000)}k Value
                  </span>
                )}
                <span className="px-2 py-0.5 rounded-sm bg-surface-soft border border-hairline text-[9px] text-muted font-bold uppercase tracking-widest">
                  {level}
                </span>
              </div>
              <h4 className={`font-display text-[18px] md:text-title-lg text-ink tracking-tight leading-tight transition-all ${trackingState === 'learned' ? 'line-through opacity-40' : ''}`}>
                {gap.skill}
              </h4>
            </div>

            {/* Right col: priority + time */}
            <div className="flex flex-col items-end gap-2 pt-1 shrink-0">
              <PriorityDots priority={gap.priority} />
              <div className="flex items-center gap-1.5 text-muted">
                <Clock size={11} />
                <span className="font-sans text-[11px] font-semibold tabular-nums">
                  {gap.weeks_to_learn}w
                </span>
              </div>
            </div>
          </div>

          {/* Reason */}
          <p className="font-sans text-body-md text-muted leading-relaxed mt-4 max-w-2xl">
            {gap.reason}
          </p>

          {/* Evidence metadata — shows resume quotes that surfaced this gap */}
          {gap.evidence_details && gap.evidence_details.length > 0 ? (
            <div className="mt-4 pt-4 border-t border-hairline/50">
              <div className="flex items-center gap-1.5 mb-2">
                <BookOpen size={12} className="text-primary" />
                <span className="font-mono text-[9px] font-bold uppercase tracking-widest text-muted">
                  Evidence metadata
                </span>
              </div>
              <ul className="space-y-1.5">
                {gap.evidence_details.slice(0, 2).map((ev, ei) => (
                  <li key={ei} className="font-sans text-[11px] text-muted leading-snug italic pl-3 border-l-2 border-primary/20">
                    &ldquo;{ev.quote}&rdquo;
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            /* Next proof — guide user to provide evidence for unverified gaps */
            <div className="mt-4 pt-4 border-t border-hairline/50 flex items-center gap-2">
              <PlusCircle size={12} className="text-brand-teal shrink-0" />
              <span className="font-sans text-[11px] text-brand-teal font-semibold">
                Next proof: Add resume evidence to verify this gap
              </span>
              {onResumeAction && (
                <button
                  onClick={onResumeAction}
                  className="ml-auto font-mono text-[9px] text-muted hover:text-ink uppercase tracking-widest transition-colors"
                >
                  Add resume evidence
                </button>
              )}
            </div>
          )}

          {/* Accuracy feedback — Is this gap accurate? */}
          <div className="mt-3 flex items-center gap-2">
            <span className="font-sans text-[11px] text-muted">
              Is this gap accurate?
            </span>
            <button
              onClick={() => sendAccuracyFeedback(true)}
              disabled={feedbackSent !== null}
              className={`flex items-center gap-1 px-2 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider transition-all border ${
                feedbackSent === true
                  ? 'bg-brand-teal/15 border-brand-teal/30 text-brand-teal'
                  : 'border-hairline text-muted hover:text-ink hover:border-ink/20'
              }`}
            >
              <ThumbsUp size={9} /> Yes
            </button>
            <button
              onClick={() => sendAccuracyFeedback(false)}
              disabled={feedbackSent !== null}
              className={`flex items-center gap-1 px-2 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider transition-all border ${
                feedbackSent === false
                  ? 'bg-brand-pink/15 border-brand-pink/30 text-brand-pink'
                  : 'border-hairline text-muted hover:text-ink hover:border-ink/20'
              }`}
            >
              <ThumbsDown size={9} /> No
            </button>
          </div>

          {/* Confidence Self-Assessment Strip */}
          {onConfidenceChange && (
            <div className="mt-4 pt-4 border-t border-hairline/50">
              <ConfidenceStrip
                skill={gap.skill}
                value={confidenceLevel ?? 'never_used'}
                onChange={onConfidenceChange}
                accentColor={trackingColor}
              />
            </div>
          )}

          {/* Feature 1: Reflection & Notes Toggle & Input */}
          <div className="mt-4 pt-4 border-t border-hairline/40">
            <button
              onClick={() => setShowNoteBox(v => !v)}
              className="flex items-center gap-2 font-sans text-xs font-semibold text-muted hover:text-ink transition-colors"
            >
              <FileText size={14} className={noteText ? 'text-primary' : 'text-muted'} />
              <span>{noteText ? 'View / Edit Reflection Note' : 'Add Reflection Note'}</span>
              {noteText && (
                <span className="w-2 h-2 rounded-full bg-primary" />
              )}
            </button>

            <AnimatePresence>
              {showNoteBox && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden mt-3 space-y-2"
                >
                  <textarea
                    value={noteText}
                    onChange={e => setNoteText(e.target.value)}
                    placeholder="Document your key learnings, projects built, or obstacles encountered..."
                    rows={3}
                    className="w-full p-3 bg-surface-soft border border-hairline rounded-xl font-sans text-body-sm text-ink placeholder:text-muted/50 focus:outline-none focus:border-primary transition-all resize-y"
                  />
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] text-muted">
                      {gap.note_updated_at ? `Saved ${new Date(gap.note_updated_at).toLocaleDateString()}` : 'Persisted to your active path'}
                    </span>
                    <button
                      onClick={handleSaveNote}
                      disabled={savingNote}
                      className="flex items-center gap-1.5 px-4 py-2 bg-ink text-on-primary font-sans text-xs font-bold rounded-lg hover:opacity-90 active:scale-95 transition-all shadow-xs disabled:opacity-50"
                    >
                      {savedNoteSuccess ? (
                        <><Check size={14} className="text-brand-teal" /> Saved!</>
                      ) : (
                        <><Save size={14} /> {savingNote ? 'Saving...' : 'Save Note'}</>
                      )}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* ── Strategic Focus (slides in) ───────────────────────── */}
        <AnimatePresence>
          {status === 'done' && skillResources && (
            <motion.div variants={slide} initial="hidden" animate="visible" exit="exit" className="overflow-hidden">
              <div className="mx-5 md:mx-8 mb-0 px-4 md:px-5 py-4 rounded-lg bg-surface-soft border border-hairline">
                <div className="flex items-center gap-2 mb-1.5">
                  <Sparkles size={13} className="text-primary" />
                  <span className="font-sans text-[10px] font-bold uppercase tracking-widest text-primary">
                    Strategic Focus
                  </span>
                </div>
                <p className="font-sans text-body-sm text-muted leading-relaxed">
                  {skillResources.focus_summary}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Action bar ────────────────────────────────────────── */}
        <div className="px-5 md:px-8 py-5 mt-2">
          {status === 'idle' && (
            <button
              onClick={generate}
              className="flex items-center gap-2.5 bg-primary text-on-primary font-sans font-semibold text-button px-6 py-3 rounded-md hover:bg-primary-active transition-colors tactile-button"
            >
              <Play size={14} className="fill-current" />
              Generate Curriculum
            </button>
          )}

          {status === 'loading' && (
            <div className="flex items-center gap-3 text-muted font-sans text-body-sm">
              <div className="w-4 h-4 rounded-full border-2 border-muted border-t-primary animate-spin shrink-0" />
              Synthesizing optimized path...
            </div>
          )}

          {status === 'error' && (
            <div className="flex items-center justify-between p-4 rounded-md bg-brand-pink/10 border border-brand-pink/20">
              <div className="flex items-center gap-2.5 text-brand-pink font-sans text-body-sm">
                <AlertCircle size={15} />
                {error}
              </div>
              <button onClick={generate} className="flex items-center gap-1.5 text-brand-pink hover:underline font-bold uppercase tracking-widest text-[10px]">
                <RotateCcw size={12} />
                Retry
              </button>
            </div>
          )}

          {status === 'done' && skillResources && (
            <div className="flex items-center gap-2.5">
              <button
                onClick={e => { e.stopPropagation(); setIsExpanded(v => !v); }}
                className="flex items-center gap-2 px-5 py-2.5 bg-ink text-on-primary rounded-md font-sans font-semibold text-button hover:opacity-90 transition-opacity tactile-button"
              >
                <Layers size={14} />
                {isExpanded ? 'Hide' : skillResources.resources.length} Resources
                <motion.span animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.25 }}>
                  <ChevronDown size={13} />
                </motion.span>
              </button>

              <button
                onClick={generate}
                className="flex items-center gap-2 px-5 py-2.5 border border-brand-lavender/30 bg-brand-lavender/5 hover:bg-brand-lavender/10 rounded-md font-sans font-semibold text-button text-brand-lavender transition-all active:scale-95"
              >
                <Sparkles size={14} />
                Deepen
              </button>
            </div>
          )}
        </div>

        {/* ── Expanded resource list ────────────────────────────── */}
        <AnimatePresence>
          {isExpanded && skillResources && (
            <motion.div variants={slide} initial="hidden" animate="visible" exit="exit" className="overflow-hidden">
              <div className="border-t border-hairline mx-5 md:mx-8 pt-5 pb-7 flex flex-col gap-4">
                {skillResources.resources.map((res, i) => (
                  <ResourceCard key={`${res.url}-${i}`} resource={res} />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Footer ───────────────────────────────────────────── */}
        <AnimatePresence>
          {status === 'done' && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="flex items-center justify-between px-5 md:px-8 py-3 border-t border-hairline bg-surface-soft/50"
            >
              <div className="flex items-center gap-2 text-brand-teal font-bold text-[10px] uppercase tracking-widest">
                <CheckCircle2 size={12} />
                Validated for {companyType}
              </div>
              <span className="font-mono text-[10px] text-muted uppercase tracking-widest">
                {skillResources?.resources.length ?? 0} items · {gap.weeks_to_learn}wk
              </span>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </MotionConfig>
  );
};

export const SkillCard = React.memo(SkillCardComponent);
