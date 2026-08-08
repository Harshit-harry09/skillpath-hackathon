// components/JobHistoryRail.tsx
'use client';

import { useEffect, useState } from 'react';
import { Clock, CheckCircle2 } from 'lucide-react';
import type { ArchivedJob } from '@/types/active-job';
import { useAuth } from '@/context/AuthContext';

interface JobHistoryRailProps {
  refreshKey?: number;
}

export function JobHistoryRail({ refreshKey }: JobHistoryRailProps = {}) {
  const { getToken } = useAuth();
  const [history, setHistory] = useState<ArchivedJob[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const token = await getToken();
      if (!token) {
        setLoading(false);
        return;
      }

      fetch('/api/active-job/history', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(r => r.json())
        .then(d => setHistory(d.history ?? []))
        .catch(err => console.error('History fetch error:', err))
        .finally(() => setLoading(false));
    })();
  }, [refreshKey]);

  if (loading) return (
    <div className="space-y-3">
      <div className="h-4 w-24 bg-surface-soft animate-pulse rounded" />
      <div className="h-16 w-full bg-surface-soft animate-pulse rounded-lg" />
      <div className="h-16 w-full bg-surface-soft animate-pulse rounded-lg" />
    </div>
  );

  if (!history.length) return null;

  return (
    <div>
      <h3 className="font-sans text-[10px] font-bold uppercase tracking-widest text-muted mb-4">
        Past Targets
      </h3>
      <div className="flex flex-col gap-3">
        {history.map(job => (
          <div
            key={job.id}
            className="flex items-center gap-4 px-4 py-3 rounded-lg border border-hairline bg-surface-card opacity-60 hover:opacity-100 transition-opacity"
            style={{ borderLeftWidth: 3, borderLeftColor: job.color }}
          >
            <div className="flex-1 min-w-0">
              <p className="font-sans text-body-sm font-semibold text-ink truncate">
                {job.job_title}
              </p>
              <div className="flex items-center gap-2 text-muted mt-0.5">
                <Clock size={10} />
                <span className="font-sans text-[10px]">
                  {new Date(job.archived_at).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <CheckCircle2 size={12} className="text-brand-teal" />
              <span className="font-mono text-[11px] font-bold" style={{ color: job.color }}>
                {job.final_score}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
