'use client';

import React, { useState, useMemo } from 'react';
import { Eraser, Copy, Check, Sparkles, CheckCircle2 } from 'lucide-react';

interface BuzzwordEraserCardProps {
  resumeText: string;
}

const BUZZWORD_MAP: Record<string, string[]> = {
  'responsible for': ['Spearheaded', 'Architected', 'Orchestrated'],
  'worked on': ['Engineered', 'Developed', 'Executed'],
  'helped with': ['Collaborated on', 'Accelerated', 'Bolstered'],
  'team player': ['Cross-functional Collaborator', 'Technical Contributor'],
  'hardworking': ['Results-driven', 'High-throughput'],
  'detail-oriented': ['Precision-focused', 'Quality-driven'],
  'assisted': ['Supported execution of', 'Partnered on'],
  'handled': ['Managed', 'Resolved', 'Streamlined'],
};

export function BuzzwordEraserCard({ resumeText }: BuzzwordEraserCardProps) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const detectedBuzzwords = useMemo(() => {
    if (!resumeText) return [];
    const textLower = resumeText.toLowerCase();
    const matches: Array<{ phrase: string; suggestions: string[] }> = [];

    Object.entries(BUZZWORD_MAP).forEach(([phrase, suggestions]) => {
      if (textLower.includes(phrase)) {
        matches.push({ phrase, suggestions });
      }
    });

    return matches;
  }, [resumeText]);

  const handleCopy = (suggestion: string, idx: number) => {
    navigator.clipboard.writeText(suggestion);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="p-6 md:p-8 rounded-2xl bg-surface-card border border-hairline shadow-sm h-full flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-brand-pink/10 text-brand-pink">
              <Eraser size={20} />
            </span>
            <span className="text-[11px] font-bold text-muted uppercase tracking-widest">
              Buzzword & Weak Phrase Eraser
            </span>
          </div>
          <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
            detectedBuzzwords.length === 0
              ? 'bg-brand-teal/10 border-brand-teal/20 text-brand-teal'
              : 'bg-brand-pink/10 border-brand-pink/20 text-brand-pink'
          }`}>
            {detectedBuzzwords.length === 0 ? 'Clean Language' : `${detectedBuzzwords.length} Weak Phrases Found`}
          </span>
        </div>

        {detectedBuzzwords.length === 0 ? (
          <div className="p-5 rounded-xl bg-canvas border border-hairline flex items-center gap-3 text-brand-teal my-auto">
            <CheckCircle2 size={20} className="shrink-0 text-brand-teal" />
            <div>
              <p className="text-body-sm font-semibold text-ink">No weak buzzwords detected!</p>
              <p className="text-body-xs text-muted">Your resume uses strong, action-oriented engineering verbs.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {detectedBuzzwords.map((item, idx) => (
              <div key={item.phrase} className="p-4 rounded-xl bg-canvas border border-hairline flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] font-bold text-brand-pink uppercase tracking-wider block mb-1">
                    Weak Phrase: "{item.phrase}"
                  </span>
                  <div className="flex flex-wrap gap-2 items-center">
                    <span className="text-body-xs text-muted font-sans">Power Replacements:</span>
                    {item.suggestions.map((sug) => (
                      <span key={sug} className="px-2.5 py-1 rounded-md bg-brand-teal/10 border border-brand-teal/20 text-brand-teal text-body-xs font-semibold">
                        {sug}
                      </span>
                    ))}
                  </div>
                </div>
                <button
                  onClick={() => handleCopy(item.suggestions[0], idx)}
                  className="px-3 py-1.5 rounded-lg bg-surface-soft hover:bg-brand-teal/10 text-muted hover:text-brand-teal text-body-xs font-semibold transition-colors flex items-center gap-1.5 shrink-0"
                >
                  {copiedIndex === idx ? (
                    <>
                      <Check size={14} className="text-brand-teal" /> Copied
                    </>
                  ) : (
                    <>
                      <Copy size={14} /> Copy Top Fix
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <p className="text-[10px] text-muted mt-4">
        Replace passive buzzwords with active technical impact verbs to pass recruiter screens.
      </p>
    </div>
  );
}
