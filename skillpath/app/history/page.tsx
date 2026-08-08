'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { getHistory, removeFromHistory, clearHistory, type HistoryEntry } from '@/lib/history';
import { motion } from 'framer-motion';
import { Compass, Target } from 'lucide-react';

export default function HistoryPage() {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setEntries(getHistory());
    setMounted(true);
  }, []);

  const handleRemove = (token: string) => {
    removeFromHistory(token);
    setEntries(getHistory());
  };

  const handleClearAll = () => {
    if (window.confirm('Clear all history? This cannot be undone.')) {
      clearHistory();
      setEntries([]);
    }
  };

  if (!mounted) {
    return (
      <main className="flex flex-col min-h-screen bg-canvas text-ink pt-32">
        <div className="flex-1 flex items-center justify-center">
          <div className="w-12 h-12 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </main>
    );
  }

  return (
    <main className="flex flex-col min-h-screen bg-canvas text-ink relative font-sans">
      <div className="flex-1 flex flex-col pt-32 pb-24 px-8 lg:px-24 z-10">
        <div className="max-w-4xl mx-auto w-full">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 pb-12 gap-6 border-b border-hairline">
            <div>
              <span className="font-bold text-[11px] text-muted tracking-widest uppercase mb-4 block">Your Analyses</span>
              <h1 className="font-display text-display-lg text-ink">History</h1>
            </div>
            {entries.length > 0 && (
              <button
                onClick={handleClearAll}
                className="font-sans font-semibold text-sm text-red-500 hover:text-red-600 transition-colors self-start md:self-auto border border-red-500/20 px-6 py-3 rounded-md hover:bg-red-50"
              >
                Clear all
              </button>
            )}
          </div>

          {/* Empty State */}
          {entries.length === 0 && (
            <div className="flex flex-col items-center justify-center py-32 text-center bg-surface-card border border-hairline rounded-[24px] shadow-sm">
              <div className="w-20 h-20 rounded-xl bg-canvas border border-hairline flex items-center justify-center mb-8">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-muted">
                  <path d="M12 8v4l3 3" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx="12" cy="12" r="10" />
                </svg>
              </div>
              <h2 className="font-display text-title-lg mb-3 text-ink">No analyses yet</h2>
              <p className="font-sans text-body-md text-muted mb-8 max-w-sm leading-relaxed">
                Your past analyses will appear here. Start by analyzing a job description.
              </p>
              <Link href="/analyze">
                <button className="bg-primary text-on-primary rounded-md px-8 py-4 text-button font-sans font-bold hover:bg-primary-active active:scale-[0.98] transition-all">
                  Analyze a Job →
                </button>
              </Link>
            </div>
          )}

          {/* History List */}
          {entries.length > 0 && (
            <motion.div
              className="flex flex-col gap-6"
              initial="hidden"
              animate="show"
              variants={{
                show: {
                  transition: {
                    staggerChildren: 0.1
                  }
                }
              }}
            >
              {entries.map((entry) => (
                <motion.div
                  key={entry.share_token}
                  variants={{
                    hidden: { opacity: 0, y: 20 },
                    show: { opacity: 1, y: 0 }
                  }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  className="group relative bg-surface-card border border-hairline rounded-[24px] p-8 hover:border-primary/50 transition-all duration-300 shadow-sm"
                >
                  <Link
                    href={entry.type === 'explore' ? `/explore/${entry.share_token}` : `/results/${entry.share_token}`}
                    className="absolute inset-0 z-10 rounded-[24px]"
                  />

                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    {/* Left: Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-4 mb-4">
                        {entry.type === 'explore' ? (
                          <div className="flex items-center gap-1 text-brand-pink">
                            <Compass size={14} />
                            <span className="font-sans font-bold text-[10px] tracking-widest uppercase">Explore</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-primary">
                            <Target size={14} />
                            <span className="font-sans font-bold text-[10px] tracking-widest uppercase">Analyze</span>
                          </div>
                        )}
                        <span className="w-1 h-1 rounded-full bg-hairline" />
                        <span className="font-sans font-bold text-[11px] text-muted tracking-widest uppercase">
                          {new Date(entry.created_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </span>
                        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-sm bg-brand-teal/10 border border-brand-teal/20 text-[10px] text-brand-teal font-bold tracking-widest uppercase">
                          {entry.company_type}
                        </span>
                      </div>
                      <p className="font-sans text-body-lg text-ink font-semibold truncate mb-4">
                        {entry.jd_preview || (entry.type === 'explore' ? 'Role Exploration' : 'Job analysis')}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {entry.mvc_skills.slice(0, 4).map((skill) => (
                          <span
                            key={skill}
                            className="font-sans text-[11px] font-semibold px-3 py-1 rounded-md bg-canvas border border-hairline text-muted"
                          >
                            {skill}
                          </span>
                        ))}
                        {entry.mvc_skills.length > 4 && (
                          <span className="font-sans text-[11px] font-bold px-2 py-1 text-muted">
                            +{entry.mvc_skills.length - 4} more
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Right: Score + Actions */}
                    <div className="flex items-center gap-8">
                      <div className="text-right flex flex-col items-end">
                        {entry.type !== 'explore' && entry.gap_score !== undefined && (
                          <>
                            <div className="flex items-baseline gap-1 justify-end mb-2">
                              <span className="font-display text-title-xl text-ink">{entry.gap_score}</span>
                              <span className="font-sans font-bold text-[12px] text-muted">/100</span>
                            </div>
                            <ProgressBar progress={entry.gap_score} className="w-24 mb-2" />
                          </>
                        )}
                        <span className="font-sans font-bold text-[11px] tracking-widest uppercase text-muted">
                          {entry.weeks_required} weeks
                        </span>
                      </div>

                      {/* Remove button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemove(entry.share_token);
                        }}
                        className="relative z-20 w-10 h-10 flex items-center justify-center rounded-md bg-canvas border border-hairline text-muted hover:text-red-500 hover:border-red-200 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
                        title="Remove from history"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}

        </div>
      </div>
    </main>
  );
}
