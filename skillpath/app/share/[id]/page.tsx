// updated
// app/share/[id]/page.tsx
import { getDb } from '@/lib/firebase-admin';
import { notFound } from 'next/navigation';
import type { UserProfile } from '@/types/profile';
import type { ActiveJob } from '@/types/active-job';

export default async function SharePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let db;
  try { db = getDb(); } catch { return notFound(); }

  const shareSnap = await db.collection('share_cards').doc(id).get();
  if (!shareSnap.exists) return notFound();

  const shareData = shareSnap.data()!;
  if (shareData.expires_at && typeof shareData.expires_at === 'string' && new Date(shareData.expires_at).getTime() < Date.now()) {
    return notFound();
  }

  const { uid } = shareData;
  const [profileSnap, jobSnap] = await Promise.all([
    db.collection('profiles').doc(uid).get(),
    db.collection('active_jobs').doc(uid).get(),
  ]);

  if (!profileSnap.exists) return notFound();

  const profile = profileSnap.data() as UserProfile;
  const job     = jobSnap.data() as ActiveJob | undefined;

  return (
    <main className="min-h-screen bg-canvas flex items-center justify-center px-6 py-12">
      <div
        className="w-full max-w-sm rounded-[32px] border border-hairline bg-surface-card overflow-hidden transition-all duration-700 animate-in fade-in zoom-in-95"
        style={{ 
          boxShadow: job ? `0 0 0 1px ${job.color}15, 0 24px 64px -16px ${job.color}25` : '0 24px 64px -16px rgba(0,0,0,0.1)' 
        }}
      >
        {job && <div className="h-2 w-full" style={{ background: job.color }} />}
        <div className="p-10 text-center">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 text-white font-display font-bold text-2xl shadow-xl"
            style={{ 
              background: profile.avatar_color,
              boxShadow: `0 8px 32px ${profile.avatar_color}40`
            }}
          >
            {profile.display_name.split(' ').filter(Boolean).map(w => w[0]).slice(0, 2).join('').toUpperCase()}
          </div>

          <h1 className="font-display text-title-lg text-ink mb-1 tracking-tight">
            {profile.display_name}
          </h1>
          
          {job ? (
            <>
              <p className="font-sans text-body-sm text-muted mb-8 font-medium">
                Targeting <span className="text-ink">{job.job_title}</span>
              </p>
              
              <div className="flex items-center justify-center gap-4 mb-5">
                <span className="font-mono text-[56px] font-bold text-ink leading-none tracking-tighter">
                  {job.readiness_score}
                </span>
                <div className="text-left">
                  <span className="block font-sans text-muted text-sm font-bold uppercase tracking-widest leading-none">Percent</span>
                  <span className="block font-sans text-ink text-lg font-bold leading-none">Ready</span>
                </div>
              </div>

              <div className="h-3 rounded-full bg-surface-strong overflow-hidden mb-8 p-0.5">
                <div
                  className="h-full rounded-full transition-all duration-1000"
                  style={{ width: `${job.readiness_score}%`, background: job.color }}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-2xl bg-surface-soft border border-hairline">
                   <span className="block font-mono text-title-sm text-ink">{job.skills.filter(s => s.state === 'learned').length}</span>
                   <span className="block font-sans text-[9px] text-muted uppercase font-bold tracking-widest mt-1">Mastered</span>
                </div>
                <div className="p-3 rounded-2xl bg-surface-soft border border-hairline">
                   <span className="block font-mono text-title-sm text-ink">{profile.streak_count}</span>
                   <span className="block font-sans text-[9px] text-muted uppercase font-bold tracking-widest mt-1">Day Streak</span>
                </div>
              </div>
            </>
          ) : (
            <div className="py-12 px-6 rounded-3xl border border-dashed border-hairline bg-surface-soft/50">
              <p className="font-sans text-body-sm text-muted">Building their career path...</p>
            </div>
          )}

          <div className="mt-10 pt-8 border-t border-hairline">
            <p className="font-sans text-[10px] text-muted/40 uppercase tracking-[0.2em] font-bold">
              Powered by SkillPath
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
