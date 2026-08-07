'use client';
// updated

import React, { useState } from 'react';
import { Link2, Copy, Check, Loader2 } from 'lucide-react';

interface LinkedInHeadlineOptimizerProps {
  roleLabel: string;
  topSkills: string[];
}

export function LinkedInHeadlineOptimizer({ roleLabel, topSkills }: LinkedInHeadlineOptimizerProps) {
  const [headlines, setHeadlines] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState<number | null>(null);

  const generate = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/generate-linkedin-headlines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: roleLabel, topSkills: topSkills.slice(0, 6) }),
      });
      const data = await res.json();
      if (Array.isArray(data.headlines) && data.headlines.length > 0) {
        setHeadlines(data.headlines);
      } else {
        setHeadlines([
          `${roleLabel} | ${topSkills.slice(0, 3).join(' • ')} | Open to ${roleLabel} Roles`,
          `Data-Driven ${roleLabel} | ${topSkills.join(' | ')} | Open to Opportunities`,
          `${roleLabel} Specialist | Scaling Production Systems | Open to ${roleLabel} Roles`,
        ]);
      }
    } catch {
      setHeadlines([
        `${roleLabel} | ${topSkills.slice(0, 3).join(' • ')} | Open to ${roleLabel} Roles`,
        `Data-Driven ${roleLabel} | ${topSkills.join(' | ')} | Open to Opportunities`,
        `${roleLabel} Specialist | Scaling Production Systems | Open to ${roleLabel} Roles`,
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (h: string, idx: number) => {
    navigator.clipboard.writeText(h);
    setCopied(idx);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="p-6 md:p-8 rounded-2xl bg-surface-card border border-hairline shadow-sm h-full flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-[#0077b5]/10 text-[#0077b5]"><Link2 size={18} /></span>
            <span className="text-[11px] font-bold text-muted uppercase tracking-widest">LinkedIn Headline Optimizer</span>
          </div>
          {headlines.length > 0 && (
            <button onClick={generate} disabled={loading}
              className="text-body-xs text-muted hover:text-ink transition-colors font-semibold"
            >
              Regenerate ↺
            </button>
          )}
        </div>

        {headlines.length === 0 ? (
          <div className="text-center py-6 my-auto">
            <p className="text-body-sm text-muted mb-6">
              Generate 3 data-driven LinkedIn headlines for <strong className="text-ink">{roleLabel}</strong> based on your top matched skills.
            </p>
            <button onClick={generate} disabled={loading}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#0077b5] text-white font-sans font-semibold text-button hover:bg-[#005a8e] transition-all disabled:opacity-50"
            >
              {loading
                ? <><Loader2 size={16} className="animate-spin" /> Generating...</>
                : <><Link2 size={16} /> Generate Headlines</>
              }
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {headlines.map((h, i) => (
              <div key={i} className="p-4 rounded-xl bg-canvas border border-hairline flex items-center gap-3">
                <span className="shrink-0 w-5 h-5 rounded-full bg-[#0077b5]/10 border border-[#0077b5]/20 text-[#0077b5] text-[10px] font-bold flex items-center justify-center">
                  {i + 1}
                </span>
                <p className="text-body-sm text-ink flex-1 font-medium">{h}</p>
                <button onClick={() => handleCopy(h, i)}
                  className="shrink-0 p-1.5 rounded-lg text-muted hover:text-brand-teal hover:bg-brand-teal/10 transition-colors"
                >
                  {copied === i ? <Check size={14} className="text-brand-teal" /> : <Copy size={14} />}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <p className="text-[10px] text-muted mt-4">
        Optimized headlines improve LinkedIn search visibility & recruiter inbound messages.
      </p>
    </div>
  );
}
