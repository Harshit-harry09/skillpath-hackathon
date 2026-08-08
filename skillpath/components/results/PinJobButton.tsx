'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bookmark, BookmarkCheck, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import type { SkillGap } from '@/types/analysis';
import type { ActiveJob } from '@/types/active-job';

interface PinJobButtonProps {
  analysisId: string;
  jobTitle: string;
  companyType: string;
  role: string;
  seniority: string;
  skillGaps: SkillGap[];
  resumeSkills?: string[];
  readinessScore?: number;
  isPinned: boolean;
  onPinned: (job: ActiveJob) => void;
  /** Optional accent color to override the default teal */
  accentColor?: string;
  /** Controls visual variant — 'sidebar' (wide pill) or 'inline' (compact) */
  variant?: 'sidebar' | 'inline';
}

type PinState = 'idle' | 'loading' | 'pinned' | 'error';

export function PinJobButton({
  analysisId,
  jobTitle,
  companyType,
  role,
  seniority,
  skillGaps,
  resumeSkills = [],
  readinessScore,
  isPinned,
  onPinned,
  accentColor,
  variant = 'sidebar',
}: PinJobButtonProps) {
  const { getToken } = useAuth();
  const [pinState, setPinState] = useState<PinState>(isPinned ? 'pinned' : 'idle');
  const [errorMsg, setErrorMsg] = useState('');

  const handlePin = async () => {
    if (pinState === 'loading' || pinState === 'pinned') return;
    setPinState('loading');
    setErrorMsg('');

    try {
      const token = await getToken();
      if (!token) {
        setErrorMsg('Sign in to track this job.');
        setPinState('error');
        return;
      }

      const skills = skillGaps.map((gap) => ({
        skill: gap.skill,
        priority: gap.priority,
        weeks_to_learn: gap.weeks_to_learn,
        in_mvc: gap.in_mvc ?? false,
        reason: gap.reason ?? '',
        state: 'not_started' as const,
        resources_generated: false,
        role_category: (gap as any).role_category,
        premium: gap.premium,
      }));

      const response = await fetch('/api/active-job', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          analysis_id: analysisId,
          job_title: jobTitle,
          company_type: companyType,
          role,
          seniority,
          skills,
          resume_skills: resumeSkills,
          readiness_score: readinessScore,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || `Server error ${response.status}`);
      }

      const data = await response.json();
      setPinState('pinned');
      onPinned(data.active_job as ActiveJob);
    } catch (err) {
      console.error('[PinJobButton] Pin failed:', err);
      setErrorMsg(err instanceof Error ? err.message : 'Failed to pin job.');
      setPinState('error');
    }
  };

  if (variant === 'inline') {
    return (
      <div className="flex flex-col items-start gap-1.5">
        <button
          type="button"
          onClick={handlePin}
          disabled={pinState === 'loading' || pinState === 'pinned'}
          className={[
            'flex items-center gap-2 min-h-11 px-4 rounded-xl font-sans text-button font-semibold transition-all active:scale-[0.96] cursor-pointer',
            pinState === 'pinned'
              ? 'bg-brand-teal/10 border border-brand-teal/30 text-brand-teal'
              : pinState === 'error'
              ? 'bg-brand-pink/10 border border-brand-pink/30 text-brand-pink'
              : 'bg-ink text-on-primary hover:opacity-90',
          ].join(' ')}
        >
          {pinState === 'loading' && <Loader2 size={14} className="animate-spin" />}
          {pinState === 'pinned' && <BookmarkCheck size={14} />}
          {pinState === 'idle' && <Bookmark size={14} />}
          {pinState === 'error' && <AlertCircle size={14} />}
          <span>
            {pinState === 'loading' ? 'Tracking…' : pinState === 'pinned' ? 'Tracking ✓' : 'Track This Job'}
          </span>
        </button>
        <AnimatePresence>
          {pinState === 'error' && errorMsg && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="font-sans text-[11px] text-brand-pink"
            >
              {errorMsg}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // sidebar variant
  return (
    <div className="space-y-2">
      <motion.button
        type="button"
        onClick={handlePin}
        disabled={pinState === 'loading' || pinState === 'pinned'}
        whileTap={{ scale: pinState === 'pinned' ? 1 : 0.97 }}
        className={[
          'w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-black text-xs uppercase tracking-wider border-2 transition-all cursor-pointer',
          pinState === 'pinned'
            ? 'bg-brand-teal/10 border-brand-teal/30 text-brand-teal shadow-none'
            : pinState === 'error'
            ? 'bg-brand-pink/10 border-brand-pink/30 text-brand-pink'
            : 'bg-ink text-on-primary border-ink shadow-[3px_3px_0_#00000033] hover:-translate-y-0.5 hover:shadow-[4px_4px_0_#00000033]',
        ].join(' ')}
      >
        {pinState === 'loading' && <Loader2 size={14} className="animate-spin" />}
        {pinState === 'pinned' && <BookmarkCheck size={14} />}
        {pinState === 'idle' && <Bookmark size={14} />}
        {pinState === 'error' && <AlertCircle size={14} />}
        <span>
          {pinState === 'loading'
            ? 'Tracking…'
            : pinState === 'pinned'
            ? 'Tracking ✓'
            : pinState === 'error'
            ? 'Try Again'
            : 'Track This Job'}
        </span>
      </motion.button>

      <AnimatePresence>
        {pinState === 'error' && errorMsg && (
          <motion.p
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="font-sans text-[11px] text-brand-pink text-center overflow-hidden"
          >
            {errorMsg}
          </motion.p>
        )}
      </AnimatePresence>

      {pinState === 'pinned' && (
        <p className="font-sans text-[10px] text-muted text-center">
          View your tracker on the{' '}
          <a href="/profile" className="text-primary underline underline-offset-2">
            Profile page
          </a>
        </p>
      )}
    </div>
  );
}
