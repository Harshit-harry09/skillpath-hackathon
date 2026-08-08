// components/profile/ActiveJobCard.tsx
'use client';

import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bookmark, ChevronDown, ChevronUp, Sparkles, Trophy, X, Briefcase } from 'lucide-react';
import { ReadinessRing } from '../results/ReadinessRing';
import { SkillTrackRow } from '../results/SkillTrackRow';
import { OpenJobModal } from '../results/OpenJobModal';
import { computeReadiness } from '@/lib/readiness';
import type { ActiveJob, SkillState, TrackedSkill } from '@/types/active-job';
import Link from 'next/link';
import { incrementDailyTick } from './DailyGoalWidget';
import { useAuth } from '@/context/AuthContext';

interface ActiveJobCardProps {
  job: ActiveJob;
  onJobUpdate: (job: ActiveJob) => void;
  onUnpin: () => void;
}

export function ActiveJobCard({ job, onJobUpdate, onUnpin }: ActiveJobCardProps) {
  const { getToken } = useAuth();
  const [expanded, setExpanded] = useState(true);
  const [showAllSkills, setShowAllSkills] = useState(false);
  const [nextSkill, setNextSkill] = useState<TrackedSkill | null>(null);
  const [showResources, setShowResources] = useState(false);
  const [showOpenJobModal, setShowOpenJobModal] = useState(false);

  // Auto popup modal once when readiness score reaches 80%
  useEffect(() => {
    if (job.readiness_score >= 80) {
      const storageKey = `open_job_modal_popped_${job.id || job.analysis_id}`;
      if (!sessionStorage.getItem(storageKey)) {
        setShowOpenJobModal(true);
        sessionStorage.setItem(storageKey, 'true');
      }
    }
  }, [job.readiness_score, job.id, job.analysis_id]);

  const handleStateChange = useCallback(async (skill: string, state: SkillState) => {
    const token = await getToken();
    if (!token) {
      console.error('[SkillTrack] No auth token found');
      return;
    }

    // 1. Optimistic Update (Instant feedback)
    const optimisticSkills = job.skills.map(s => {
      if (s.skill !== skill) return s;
      return {
        ...s,
        state,
        learned_at: state === 'learned' ? new Date().toISOString() : s.learned_at,
      };
    });

    const newScore = computeReadiness(optimisticSkills, job.resume_skills, job.baseline_score);

    onJobUpdate({
      ...job,
      skills: optimisticSkills,
      readiness_score: newScore,
    });

    // 2. Increment Daily Goal tick if learned
    if (state === 'learned') {
      incrementDailyTick();
    }

    // 3. Sync with DB
    try {
      const res = await fetch('/api/active-job', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ skill, state }),
      });

      if (!res.ok) throw new Error('API Sync Failed');

      const data = await res.json();
      if (data.skills && typeof data.readiness_score === 'number') {
        onJobUpdate({
          ...job,
          skills: data.skills,
          readiness_score: data.readiness_score,
        });
      }

      // If user marked a skill learned, log streak & timeline
      if (state === 'learned') {
        fetch('/api/profile/streak', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        }).catch(err => console.error('Streak sync err', err));

        fetch('/api/profile/timeline', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ skill }),
        }).catch(err => console.error('Timeline sync err', err));

        // Find next highest priority unlearned skill
        const remaining = job.skills
          .filter(s => s.skill !== skill && s.state !== 'learned')
          .sort((a, b) => (b.priority || 0) - (a.priority || 0));

        if (remaining.length > 0) {
          setNextSkill(remaining[0]);
          setShowResources(true);
        }
      }

    } catch (err) {
      console.error('[SkillTrack] Error syncing state:', err);
    }
  }, [job, onJobUpdate, getToken]);

  const handleUnpin = async () => {
    const token = await getToken();
    await fetch('/api/active-job/archive', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    onUnpin();
  };

  const learned = job.skills.filter(s => s.state === 'learned').length;
  const total = job.skills.length;
  const isComplete = job.readiness_score >= 80;

  return (
    <div
      className="rounded-2xl border border-hairline bg-surface-card overflow-hidden transition-all shadow-sm"
      style={{ boxShadow: `0 0 0 1px ${job.color}22, 0 4px 24px ${job.color}18` }}
    >
      <div className="h-1.5 w-full" style={{ background: job.color }} />

      {/* Card Header */}
      <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <ReadinessRing
            score={job.readiness_score}
            color={job.color}
            size={68}
            strokeWidth={6}
          />
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-display font-bold text-title-md text-ink">
                {job.job_title}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase border border-hairline bg-surface-soft text-muted">
                {job.seniority || 'Senior'}
              </span>
            </div>
            <p className="font-sans text-body-sm text-muted">
              {learned} of {total} skill requirements mastered ({job.readiness_score}%)
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 self-end md:self-center">
          <Link
            href={`/jobs?search=${encodeURIComponent(job.job_title)}`}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-surface-soft hover:bg-surface-strong border border-hairline text-ink transition-all text-xs font-bold cursor-pointer"
          >
            <Briefcase size={14} className="text-brand-teal" />
            <span>Job Openings</span>
          </Link>
          <button
            onClick={() => setExpanded(v => !v)}
            className="p-2.5 rounded-xl border border-hairline hover:bg-surface-soft transition-colors text-ink cursor-pointer"
            aria-label="Toggle details"
          >
            <motion.div animate={{ rotate: expanded ? 180 : 0 }}>
              <ChevronDown size={16} />
            </motion.div>
          </button>
          <button
            onClick={handleUnpin}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-muted hover:text-brand-pink border border-hairline hover:border-brand-pink/30 hover:bg-brand-pink/5 transition-all text-xs font-bold cursor-pointer"
          >
            <Bookmark size={14} className="fill-current text-muted" />
            <span>Unpin Target</span>
          </button>
        </div>
      </div>

      {/* Ready to Apply Celebration Banner */}
      <AnimatePresence>
        {isComplete && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mx-6 mb-4 px-4 py-3.5 rounded-2xl bg-brand-teal/10 border border-brand-teal/30 flex items-center justify-between gap-3 shadow-xs"
          >
            <div className="flex items-center gap-3">
              <Trophy size={20} className="text-brand-teal shrink-0 animate-bounce" />
              <div>
                <p className="font-sans text-body-sm text-brand-teal font-bold leading-tight">
                  You&apos;re ready to apply! (Readiness is above 80%)
                </p>
                <p className="font-sans text-[11px] text-muted font-medium mt-0.5">
                  {job.readiness_score}% requirement coverage achieved for {job.job_title}
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowOpenJobModal(true)}
              className="px-4 py-2 rounded-xl bg-ink text-on-primary font-sans text-xs font-bold hover:opacity-90 transition-all shrink-0 cursor-pointer shadow-md active:scale-95"
            >
              Open Job Modal →
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <OpenJobModal
        isOpen={showOpenJobModal}
        onClose={() => setShowOpenJobModal(false)}
        jobTitle={job.job_title}
        readinessScore={job.readiness_score}
        companyType={job.company_type}
        analysisId={job.analysis_id}
      />

      {/* Skill Gaps List */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="px-6 pb-6 space-y-2">
              <div className="flex items-center justify-between mb-2">
                <span className="font-sans text-[10px] font-bold uppercase tracking-widest text-muted">
                  Tactile Requirements Tracker
                </span>
              </div>

              {(() => {
                const sortedSkills = job.skills
                  .slice()
                  .sort((a, b) => {
                    if (a.state === 'learned' && b.state !== 'learned') return 1;
                    if (b.state === 'learned' && a.state !== 'learned') return -1;
                    return (b.priority || 0) - (a.priority || 0);
                  });

                const visibleSkills = showAllSkills ? sortedSkills : sortedSkills.slice(0, 5);
                const remainingCount = sortedSkills.length - 5;

                return (
                  <>
                    {visibleSkills.map((skill) => (
                      <SkillTrackRow
                        key={skill.skill}
                        skill={skill}
                        accentColor={job.color}
                        onStateChange={handleStateChange}
                      />
                    ))}

                    {sortedSkills.length > 5 && (
                      <button
                        type="button"
                        onClick={() => setShowAllSkills((v) => !v)}
                        className="w-full flex items-center justify-center gap-2 py-3 mt-3 rounded-xl bg-surface-soft/80 hover:bg-surface-strong border border-hairline font-sans text-xs font-bold text-ink transition-all cursor-pointer shadow-xs active:scale-[0.98]"
                      >
                        {showAllSkills ? (
                          <>
                            <ChevronUp size={14} />
                            <span>Show Less</span>
                          </>
                        ) : (
                          <>
                            <ChevronDown size={14} />
                            <span>View More Skills ({remainingCount} remaining)</span>
                          </>
                        )}
                      </button>
                    )}
                  </>
                );
              })()}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Next Step Recommendation */}
      <AnimatePresence>
        {showResources && nextSkill && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mx-6 mb-6 p-4 rounded-xl bg-surface-soft border border-hairline"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Sparkles size={14} className="text-primary" />
                <span className="font-sans text-xs font-bold text-ink">
                  Next Step Recommendation
                </span>
              </div>
              <button onClick={() => setShowResources(false)} className="text-muted hover:text-ink">
                <X size={13} />
              </button>
            </div>
            <p className="font-sans text-body-sm text-muted mb-3">
              Start learning <strong className="text-ink">{nextSkill.skill}</strong> — your next highest priority gap.
            </p>
            <Link
              href={`/results/${job.analysis_id}?skill=${encodeURIComponent(nextSkill.skill)}`}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-on-primary font-sans font-semibold text-button hover:bg-primary-active transition-colors"
            >
              <Sparkles size={13} />
              Generate Resources
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
