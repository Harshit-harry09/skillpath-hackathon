'use client';

import React, { useMemo } from 'react';
import { Hash, AlertCircle, CheckCircle2 } from 'lucide-react';

interface QuantificationScannerProps {
  resumeText: string;
}

const HAS_METRIC = /\d+\s*(%|ms|s\b|x\b|\$|k\b|m\b|billion|million|requests|users|reduction|improvement|faster|slower|hours|days|weeks|months)/i;
const BULLET_RE = /^[\s•\-*–>]\s*(.{20,150})$/gm;

const SUGGESTED_METRICS: string[] = [
  'Reduced latency by X%',
  'Improved throughput by Xrpm',
  'Increased user retention by X%',
  'Cut deployment time by Xmin',
  'Handled X concurrent requests/s',
];

export function QuantificationScanner({ resumeText }: QuantificationScannerProps) {
  const { weak, strong } = useMemo(() => {
    if (!resumeText) return { weak: [], strong: [] };
    const bullets: string[] = [];
    let match: RegExpExecArray | null;
    const re = new RegExp(BULLET_RE.source, BULLET_RE.flags);
    while ((match = re.exec(resumeText)) !== null) {
      bullets.push(match[1].trim());
    }
    const strong = bullets.filter(b => HAS_METRIC.test(b));
    const weak = bullets.filter(b => !HAS_METRIC.test(b)).slice(0, 4);
    return { weak, strong };
  }, [resumeText]);

  const total = weak.length + strong.length;
  const pct = total > 0 ? Math.round((strong.length / total) * 100) : 0;

  return (
    <div className="p-6 md:p-8 rounded-2xl bg-surface-card border border-hairline shadow-sm h-full flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-brand-ochre/10 text-brand-ochre"><Hash size={18} /></span>
            <span className="text-[11px] font-bold text-muted uppercase tracking-widest">Resume Quantification Scanner</span>
          </div>
          <span className={`text-[11px] font-bold px-3 py-1 rounded-full border ${
            pct >= 60 ? 'bg-brand-teal/10 border-brand-teal/20 text-brand-teal'
                      : 'bg-brand-pink/10 border-brand-pink/20 text-brand-pink'
          }`}>
            {pct}% Quantified
          </span>
        </div>

        {/* Progress bar */}
        <div className="w-full h-2 rounded-full bg-surface-soft overflow-hidden mb-6">
          <div
            className="h-full bg-brand-teal transition-[width] duration-300 ease-out"
            style={{ width: `${pct}%` }}
          />
        </div>

        {weak.length === 0 ? (
          <div className="p-5 rounded-xl bg-canvas border border-hairline flex items-center gap-3 text-brand-teal my-auto">
            <CheckCircle2 size={20} className="shrink-0 text-brand-teal" />
            <div>
              <p className="text-body-sm font-semibold text-ink">All bullets are quantified!</p>
              <p className="text-body-xs text-muted">Outstanding metrics coverage across your resume bullets. ✨</p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-body-xs text-muted mb-3">
              <strong className="text-ink">{weak.length} bullets</strong> lack a metric — add numbers to pass ATS quantification checks.
            </p>
            {weak.map((bullet, i) => (
              <div key={i} className="p-3 rounded-xl bg-canvas border border-hairline">
                <div className="flex items-start gap-2 mb-2">
                  <AlertCircle size={14} className="text-brand-pink shrink-0 mt-0.5" />
                  <p className="text-body-xs text-ink line-clamp-2">"{bullet}"</p>
                </div>
                <p className="text-[10px] text-muted pl-5">
                  💡 Suggested: <span className="text-brand-teal font-semibold">{SUGGESTED_METRICS[i % SUGGESTED_METRICS.length]}</span>
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      <p className="text-[10px] text-muted mt-4">
        Quantified bullets increase recruiter interview callbacks by up to 40%.
      </p>
    </div>
  );
}
