'use client';

import React, { useState } from 'react';
import { PenLine, Copy, Check, Loader2 } from 'lucide-react';

interface CoverLetterGeneratorProps {
  roleLabel: string;
  topSkills: string[];
}

export function CoverLetterGenerator({ roleLabel, topSkills }: CoverLetterGeneratorProps) {
  const [lines, setLines] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState<number | null>(null);

  const generate = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/generate-cover-lines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: roleLabel, topSkills: topSkills.slice(0, 5) }),
      });
      const data = await res.json();
      if (Array.isArray(data.lines) && data.lines.length > 0) {
        setLines(data.lines);
      } else {
        setLines([
          `With extensive expertise in ${topSkills.slice(0, 3).join(', ')}, I engineer high-impact solutions for ${roleLabel} positions.`,
          `Driven by technical excellence in ${topSkills[0] || 'engineering'}, I bring proven architecture experience to your ${roleLabel} team.`,
          `My background in ${topSkills.join(' and ')} enables me to deliver immediate value as a ${roleLabel}.`,
        ]);
      }
    } catch {
      setLines([
        `With extensive expertise in ${topSkills.slice(0, 3).join(', ')}, I engineer high-impact solutions for ${roleLabel} positions.`,
        `Driven by technical excellence in ${topSkills[0] || 'engineering'}, I bring proven architecture experience to your ${roleLabel} team.`,
        `My background in ${topSkills.join(' and ')} enables me to deliver immediate value as a ${roleLabel}.`,
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (line: string, idx: number) => {
    navigator.clipboard.writeText(line);
    setCopied(idx);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="p-6 md:p-8 rounded-2xl bg-surface-card border border-hairline shadow-sm">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <span className="p-2 rounded-lg bg-brand-pink/10 text-brand-pink"><PenLine size={18} /></span>
          <span className="text-[11px] font-bold text-muted uppercase tracking-widest">Cover Letter Punch Line Generator</span>
        </div>
        {lines.length > 0 && (
          <button
            onClick={generate}
            disabled={loading}
            className="text-body-xs text-muted hover:text-ink transition-colors font-semibold"
          >
            Regenerate ↺
          </button>
        )}
      </div>

      {lines.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-body-sm text-muted mb-6">
            Generate 3 high-impact cover letter opening sentences tailored to <strong className="text-ink">{roleLabel}</strong>.
          </p>
          <button
            onClick={generate}
            disabled={loading}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-on-primary font-sans font-semibold text-button hover:bg-primary-active transition-all disabled:opacity-50"
          >
            {loading ? <><Loader2 size={16} className="animate-spin" /> Generating...</> : <><PenLine size={16} /> Generate Opening Lines</>}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {lines.map((line, i) => (
            <div key={i} className="p-4 rounded-xl bg-canvas border border-hairline flex items-start gap-3">
              <span className="shrink-0 w-5 h-5 rounded-full bg-brand-pink/10 border border-brand-pink/20 text-brand-pink text-[10px] font-bold flex items-center justify-center mt-0.5">
                {i + 1}
              </span>
              <p className="text-body-sm text-ink flex-1 leading-relaxed">"{line}"</p>
              <button
                onClick={() => handleCopy(line, i)}
                className="shrink-0 p-1.5 rounded-lg text-muted hover:text-brand-teal hover:bg-brand-teal/10 transition-colors"
              >
                {copied === i ? <Check size={14} className="text-brand-teal" /> : <Copy size={14} />}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
