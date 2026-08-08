// components/profile/SkillTimeline.tsx
'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, CheckCircle2, Zap, Minus, Plus } from 'lucide-react';
import type { TimelineEntry } from '@/types/profile';
import { useAuth } from '@/context/AuthContext';

function groupByMonth(entries: TimelineEntry[]) {
  const map = new Map<string, TimelineEntry[]>();
  entries.forEach(e => {
    const month = new Date(e.timestamp).toLocaleDateString('en-GB', {
      month: 'long', year: 'numeric',
    });
    if (!map.has(month)) map.set(month, []);
    map.get(month)!.push(e);
  });
  return map;
}

export function SkillTimeline() {
  const { getToken } = useAuth();
  const [entries, setEntries] = useState<TimelineEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCollapsed, setIsCollapsed] = useState(true);

  useEffect(() => {
    (async () => {
      const token = await getToken();
      fetch('/api/profile/timeline', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(r => r.json())
        .then(d => {
          const sorted = (d.entries ?? []).sort((a: TimelineEntry, b: TimelineEntry) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          );
          setEntries(sorted);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    })();
  }, []);

  const grouped = groupByMonth(entries);

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-16 rounded-2xl bg-surface-soft border border-hairline animate-pulse" />
        ))}
      </div>
    );
  }

  if (!entries.length) {
    return (
      <div className="px-8 py-12 rounded-[32px] border border-dashed border-hairline text-center bg-surface-soft/20">
        <div className="w-12 h-12 rounded-full bg-surface-soft border border-hairline flex items-center justify-center mx-auto mb-4 text-muted">
          <Clock size={20} />
        </div>
        <p className="font-display text-title-sm text-ink mb-1">Growth Log Empty</p>
        <p className="font-sans text-body-sm text-muted max-w-[240px] mx-auto">
          Start mastering skills to build your professional learning timeline.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-surface-card border border-hairline rounded-[32px] overflow-hidden shadow-sm">
      {/* Log Header */}
      <div className="p-8 pb-6 flex items-center justify-between border-b border-hairline/30 bg-surface-soft/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-ink flex items-center justify-center text-on-primary">
            <Clock size={18} />
          </div>
          <div>
            <h2 className="font-display text-title-md text-ink">Chronological Log</h2>
            <p className="font-sans text-body-sm text-muted">A history of your professional growth</p>
          </div>
        </div>

        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-2.5 rounded-xl border border-hairline text-muted hover:text-ink hover:bg-surface-soft transition-all"
        >
          {isCollapsed ? (
            <div className="flex items-center gap-2 px-1">
              <span className="font-sans text-[10px] font-bold uppercase tracking-widest">Expand</span>
              <Plus size={14} />
            </div>
          ) : (
            <div className="flex items-center gap-2 px-1">
              <span className="font-sans text-[10px] font-bold uppercase tracking-widest">Collapse</span>
              <Minus size={14} />
            </div>
          )}
        </button>
      </div>

      <AnimatePresence initial={false}>
        {!isCollapsed && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] as any }}
          >
            <div className="p-8 space-y-8">
              {[...grouped.entries()].map(([month, groupEntries]) => (
                <div key={month} className="space-y-4">
                  <span className="font-sans text-[10px] font-bold uppercase tracking-[0.2em] text-muted block">
                    {month}
                  </span>
                  <div className="space-y-3">
                    {groupEntries.map(entry => (
                      <div
                        key={entry.id}
                        className="flex items-center justify-between p-4 rounded-2xl border border-hairline bg-surface-soft/30 hover:bg-surface-soft transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          {entry.state === 'learned' ? (
                            <CheckCircle2 size={16} className="text-brand-teal shrink-0" />
                          ) : (
                            <Zap size={16} className="text-primary shrink-0" />
                          )}
                          <div>
                            <span className="font-sans text-body-sm font-semibold text-ink block">
                              {entry.skill}
                            </span>
                            <span className="font-sans text-[10px] text-muted">
                              {entry.job_title}
                            </span>
                          </div>
                        </div>
                        <span className="font-mono text-[10px] text-muted font-medium">
                          {new Date(entry.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
