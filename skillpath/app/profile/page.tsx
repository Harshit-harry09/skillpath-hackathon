// app/profile/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ActiveJobCard } from '@/components/profile/ActiveJobCard';
import { JobHistoryRail } from '@/components/profile/JobHistoryRail';
import { ProfileHeader } from '@/components/profile/ProfileHeader';
import { StatsBar } from '@/components/profile/StatsBar';
import { DailyGoalWidget } from '@/components/profile/DailyGoalWidget';
import { ResumeSnapshot } from '@/components/profile/ResumeSnapshot';
import { SkillTimeline } from '@/components/profile/SkillTimeline';
import { ProfileBadges } from '@/components/profile/ProfileBadges';
import { SalaryRoiCard } from '@/components/profile/SalaryRoiCard';
import { ProfileExportModal } from '@/components/profile/ProfileExportModal';
import { LearnerSummaryCard } from '@/components/profile/LearnerSummaryCard';
import { computeWeeksRemaining } from '@/lib/profile-utils';
import type { ActiveJob } from '@/types/active-job';
import type { UserProfile } from '@/types/profile';
import { useAuth } from '@/context/AuthContext';
import { nameToColor } from '@/lib/profile-utils';
import Link from 'next/link';
import { ArrowRight, Share2 } from 'lucide-react';

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: [0.16, 1, 0.3, 1] as any },
  }),
};

export default function ProfilePage() {
  const { user, getToken } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [activeJob, setActiveJob] = useState<ActiveJob | null | 'loading'>('loading');
  const [showExportModal, setShowExportModal] = useState(false);
  const [historyKey, setHistoryKey] = useState(0);

  // Local bootstrap from AuthContext to prevent blank states
  useEffect(() => {
    if (user && !profile) {
      setProfile({
        uid: 'loading',
        display_name: user.name,
        email: user.email,
        avatar_color: nameToColor(user.name),
        streak_count: 0,
        streak_last_date: '',
        total_skills_learned: 0,
        created_at: new Date().toISOString()
      });
    }
  }, [user]);

  useEffect(() => {
    (async () => {
      const token = await getToken();
      if (!token) {
        setActiveJob(null);
        return;
      }
      const headers = { 'Authorization': `Bearer ${token}` };
      const params = new URLSearchParams();
      if (user?.name) params.append('name', user.name);
      if (user?.email) params.append('email', user.email);

      Promise.all([
        fetch(`/api/profile?${params.toString()}`, { headers }).then(r => r.json()),
        fetch('/api/active-job', { headers }).then(r => r.json()),
      ]).then(([pData, jData]) => {
        if (pData.profile) setProfile(pData.profile);
        setActiveJob(jData.active_job ?? null);
      }).catch(err => {
        console.error('[Profile] Fetch error:', err);
        setActiveJob(null);
      });
    })();
  }, []);

  const stats = {
    skills_learned: profile?.total_skills_learned ?? 0,
    streak_count: profile?.streak_count ?? 0,
    market_fit: activeJob && activeJob !== 'loading' ? activeJob.readiness_score : 0,
    weeks_remaining: activeJob && activeJob !== 'loading'
      ? computeWeeksRemaining(activeJob.skills)
      : 0,
  };

  const existingSkills: string[] = activeJob && activeJob !== 'loading'
    ? (activeJob.resume_skills?.length ? activeJob.resume_skills : [])
    : [];

  const trackedSkills = activeJob && activeJob !== 'loading' ? activeJob.skills : [];

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-28 space-y-8">

      {/* Export Modal */}
      {profile && (
        <ProfileExportModal
          isOpen={showExportModal}
          onClose={() => setShowExportModal(false)}
          profile={profile}
          activeJob={activeJob && activeJob !== 'loading' ? activeJob : null}
        />
      )}

      {/* Top Banner: Identity Header + High-Level Stats Bar */}
      <div className="space-y-6">
        {profile && (
          <motion.div custom={0} variants={fadeUp} initial="hidden" animate="visible">
            <ProfileHeader
              profile={profile}
              onUpdate={p => setProfile(p)}
            />
          </motion.div>
        )}

        <motion.div custom={1} variants={fadeUp} initial="hidden" animate="visible">
          <StatsBar stats={stats} accentColor={
            activeJob && activeJob !== 'loading' ? activeJob.color : undefined
          } />
        </motion.div>
      </div>

      {/* Main Left-Right Dashboard Grid (12-Column Layout) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT COLUMN: Executive Summary, Daily Goal, Evolution Profile & History (5 Cols) */}
        <div className="lg:col-span-5 space-y-8">
          {/* Executive Summary Card */}
          {profile && (
            <motion.div custom={1.5} variants={fadeUp} initial="hidden" animate="visible">
              <LearnerSummaryCard
                profile={profile}
                activeJob={activeJob && activeJob !== 'loading' ? activeJob : null}
                onOpenExport={() => setShowExportModal(true)}
              />
            </motion.div>
          )}

          {/* Daily Goal Protocol */}
          {profile && (
            <motion.div custom={2} variants={fadeUp} initial="hidden" animate="visible">
              <DailyGoalWidget
                streakCount={profile.streak_count}
                lastDate={profile.streak_last_date}
              />
            </motion.div>
          )}


          {/* Past Journeys & History Rail */}
          <motion.div custom={2.8} variants={fadeUp} initial="hidden" animate="visible" className="pt-6 border-t border-hairline">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-title-sm text-ink tracking-tight">Past Journeys & Archives</h2>
            </div>
            <JobHistoryRail refreshKey={historyKey} />
          </motion.div>
        </div>

        {/* RIGHT COLUMN: Active Tracker, Salary ROI, Badges & Timeline (7 Cols) */}
        <div className="lg:col-span-7 space-y-8">
          
          {/* Active Job Tracker */}
          <motion.div custom={3} variants={fadeUp} initial="hidden" animate="visible">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                <span className="font-sans text-xs font-bold uppercase tracking-[0.2em] text-ink">
                  Active Target Tracker
                </span>
              </div>

              {profile && (
                <button
                  onClick={() => setShowExportModal(true)}
                  className="flex items-center gap-1.5 font-sans text-xs font-bold text-primary hover:underline cursor-pointer"
                >
                  <Share2 size={13} />
                  <span>Export Growth Summary</span>
                </button>
              )}
            </div>

            {activeJob === 'loading' && (
              <div className="h-48 rounded-[32px] border border-hairline bg-surface-soft animate-pulse" />
            )}
            {activeJob === null && (
              <div className="px-8 py-16 rounded-[32px] border border-dashed border-hairline text-center bg-surface-soft/20 flex flex-col items-center">
                <p className="font-display text-title-sm text-ink mb-2">No active target pinned</p>
                <p className="font-sans text-body-sm text-muted max-w-[320px] mx-auto mb-8">
                  Run an analysis and pin a role to start tracking your professional growth.
                </p>
                <Link
                  href="/analyze"
                  className="flex items-center gap-3 px-8 py-4 bg-ink text-on-primary rounded-full transition-all duration-300 hover:shadow-xl active:scale-95 group"
                >
                  <span className="font-sans font-bold text-sm">Analyze Resume</span>
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            )}
            {activeJob && activeJob !== 'loading' && (
              <ActiveJobCard
                job={activeJob}
                onJobUpdate={j => setActiveJob({ ...j })}
                onUnpin={() => {
                  setActiveJob(null);
                  setHistoryKey(k => k + 1);
                }}
              />
            )}
          </motion.div>


          {/* Career Mastery Badges Matrix */}
          {profile && (
            <motion.div custom={5} variants={fadeUp} initial="hidden" animate="visible">
              <ProfileBadges
                streakCount={profile.streak_count}
                skillsLearned={profile.total_skills_learned}
                readinessScore={stats.market_fit}
                trackedSkills={trackedSkills}
              />
            </motion.div>
          )}

          {/* Chronological Activity Log */}
          <motion.div custom={6} variants={fadeUp} initial="hidden" animate="visible">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-1.5 h-1.5 rounded-full bg-muted" />
              <span className="font-sans text-xs font-bold uppercase tracking-[0.2em] text-ink">
                Chronological Activity Log
              </span>
            </div>
            <SkillTimeline />
          </motion.div>
        </div>

      </div>
    </main>
  );
}
