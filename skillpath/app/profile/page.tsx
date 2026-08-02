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
import { computeWeeksRemaining } from '@/lib/profile-utils';
import type { ActiveJob } from '@/types/active-job';
import type { UserProfile } from '@/types/profile';
import { useAuth } from '@/context/AuthContext';
import { nameToColor } from '@/lib/profile-utils';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

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

  // Extract all tracked skills from the active job analysis data
  const existingSkills: string[] = activeJob && activeJob !== 'loading'
    ? activeJob.skills.map(s => s.skill)
    : [];

  return (
    <main className="max-w-2xl mx-auto px-6 py-24 space-y-12">

      {/* Identity */}
      {profile && (
        <motion.div custom={0} variants={fadeUp} initial="hidden" animate="visible">
          <ProfileHeader
            profile={profile}
            onUpdate={p => setProfile(p)}
          />
        </motion.div>
      )}

      {/* Stats */}
      <motion.div custom={1} variants={fadeUp} initial="hidden" animate="visible">
        <StatsBar stats={stats} accentColor={
          activeJob && activeJob !== 'loading' ? activeJob.color : undefined
        } />
      </motion.div>

      {/* Daily goal */}
      {profile && (
        <motion.div custom={2} variants={fadeUp} initial="hidden" animate="visible">
          <DailyGoalWidget
            streakCount={profile.streak_count}
            lastDate={profile.streak_last_date}
          />
        </motion.div>
      )}

      {/* Active tracker */}
      <motion.div custom={3} variants={fadeUp} initial="hidden" animate="visible">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-1.5 h-1.5 rounded-full bg-primary" />
          <span className="font-sans text-[10px] font-bold uppercase tracking-[0.2em] text-muted">
            Tactile Tracker
          </span>
        </div>

        {activeJob === 'loading' && (
          <div className="h-48 rounded-[32px] border border-hairline bg-surface-soft animate-pulse" />
        )}
        {activeJob === null && (
          <div className="px-8 py-16 rounded-[32px] border border-dashed border-hairline text-center bg-surface-soft/20 flex flex-col items-center">
            <p className="font-display text-title-sm text-ink mb-2">No target locked</p>
            <p className="font-sans text-body-sm text-muted max-w-[280px] mx-auto mb-8">
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
            onUnpin={() => setActiveJob(null)}
          />
        )}
      </motion.div>

      {/* Resume snapshot */}
      {activeJob && activeJob !== 'loading' && (
        <motion.div custom={4} variants={fadeUp} initial="hidden" animate="visible">
          <ResumeSnapshot
            analysisId={activeJob.analysis_id}
            existingSkills={existingSkills}
            trackedSkills={activeJob.skills}
          />
        </motion.div>
      )}

      {/* Skill timeline */}
      <motion.div custom={5} variants={fadeUp} initial="hidden" animate="visible">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-1.5 h-1.5 rounded-full bg-muted" />
          <span className="font-sans text-[10px] font-bold uppercase tracking-[0.2em] text-muted">
            Chronological Log
          </span>
        </div>
        <SkillTimeline />
      </motion.div>

      {/* Past journeys */}
      <motion.div custom={6} variants={fadeUp} initial="hidden" animate="visible" className="pt-12 border-t border-hairline">
        <div className="flex items-center gap-3 mb-8">
          <h2 className="font-display text-title-md text-ink tracking-tight">Past Journeys</h2>
        </div>
        <JobHistoryRail />
      </motion.div>
      {/* Minimal Social Footer */}
      <footer className="pt-24 pb-12 flex flex-col items-center gap-6 opacity-30 hover:opacity-100 transition-opacity duration-500">
        <div className="flex items-center gap-8">
          <a href="https://github.com/shauryap9006-cell" target="_blank" rel="noopener noreferrer" className="text-muted hover:text-ink transition-colors">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
            </svg>
          </a>
          <a href="https://www.linkedin.com/in/shaurya-singh-971005357/" target="_blank" rel="noopener noreferrer" className="text-muted hover:text-ink transition-colors">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
              <rect width="4" height="12" x="2" y="9" />
              <circle cx="4" cy="4" r="2" />
            </svg>
          </a>
          <a href="https://www.instagram.com/shaurya__pratap_07/" target="_blank" rel="noopener noreferrer" className="text-muted hover:text-ink transition-colors">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
              <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
              <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
            </svg>
          </a>
        </div>
        <span className="font-sans text-[10px] font-bold uppercase tracking-[0.4em] text-muted">
          SkillPath // 2026
        </span>
      </footer>

    </main>
  );
}
