'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, Sparkles, Edit3, Info } from 'lucide-react';

export interface DiffSuggestion {
  id: string;
  originalText: string;
  suggestedText: string;
  reason: string;
  category: 'impact' | 'jargon' | 'verb' | 'seniority';
}

interface InlineDiffEditorProps {
  initialBullet?: string;
  suggestions?: DiffSuggestion[];
  onAccept?: (suggestion: DiffSuggestion) => void;
  onReject?: (suggestion: DiffSuggestion) => void;
}

export function InlineDiffEditor({
  initialBullet,
  suggestions,
  onAccept,
  onReject,
}: InlineDiffEditorProps) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [history, setHistory] = useState<string[]>([]);

  const hasSuggestions = suggestions && suggestions.length > 0;
  const activeSuggestion = hasSuggestions ? (suggestions[activeIdx] || null) : null;

  const handleAccept = useCallback(() => {
    if (!activeSuggestion) return;
    if (onAccept) onAccept(activeSuggestion);
    setHistory((prev) => [...prev, activeSuggestion.suggestedText]);
    if (suggestions && activeIdx < suggestions.length - 1) {
      setActiveIdx((prev) => prev + 1);
    }
  }, [activeSuggestion, activeIdx, suggestions, onAccept]);

  const handleReject = useCallback(() => {
    if (!activeSuggestion) return;
    if (onReject) onReject(activeSuggestion);
    if (suggestions && activeIdx < suggestions.length - 1) {
      setActiveIdx((prev) => prev + 1);
    }
  }, [activeSuggestion, activeIdx, suggestions, onReject]);

  // Keyboard shortcut listener (Tab = Accept, Esc = Reject)
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (!activeSuggestion) return;
      if (e.key === 'Tab') {
        e.preventDefault();
        handleAccept();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        handleReject();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeSuggestion, handleAccept, handleReject]);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-hairline bg-surface-card p-5 md:p-6 shadow-sm">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-hairline pb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-teal/10 text-brand-teal border border-brand-teal/20 shrink-0">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-ink flex items-center gap-2">
              Cursor-Style Inline AI Diff Editor
              <span className="rounded-full bg-surface-soft px-2 py-0.5 text-[10px] font-mono text-muted border border-hairline">
                Interactive
              </span>
            </h3>
            <p className="text-xs text-muted mt-0.5">Review line-by-line AI edits without overwriting your original work.</p>
          </div>
        </div>

        {/* Keyboard shortcut badges */}
        {hasSuggestions && (
          <div className="flex items-center gap-2 text-[11px] font-mono text-muted bg-surface-soft/80 border border-hairline px-3 py-1.5 rounded-xl self-start sm:self-center">
            <span className="flex items-center gap-1 font-bold text-emerald-800 dark:text-emerald-400">
              <kbd className="rounded bg-surface-card px-1.5 py-0.5 border border-hairline text-[10px] font-mono">Tab</kbd> Accept
            </span>
            <span className="text-hairline">|</span>
            <span className="flex items-center gap-1 font-bold text-rose-800 dark:text-rose-400">
              <kbd className="rounded bg-surface-card px-1.5 py-0.5 border border-hairline text-[10px] font-mono">Esc</kbd> Reject
            </span>
          </div>
        )}
      </div>

      {/* Diff View Area */}
      <div className="mt-4">
        {!hasSuggestions ? (
          /* Empty state — no suggestions provided */
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-hairline bg-surface-soft/40 py-10 text-center gap-3">
            <Info className="h-8 w-8 text-muted" />
            <div>
              <h4 className="text-sm font-bold text-ink">No Diff Suggestions Available</h4>
              <p className="text-xs text-muted mt-1 max-w-xs mx-auto leading-relaxed">
                AI bullet rewrites will appear here once AI enrichment completes, or after generating STAR bullets via the STAR Bullet Generator below.
              </p>
            </div>
          </div>
        ) : activeSuggestion ? (
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSuggestion.id}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="rounded-xl border border-hairline bg-surface-soft/60 p-4"
            >
              {/* Category Tag & Reasoning */}
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-teal/30 bg-brand-teal/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-brand-teal">
                  <Edit3 className="h-3 w-3" />
                  {activeSuggestion.category} optimization
                </span>
                <span className="text-xs text-muted font-semibold">
                  Suggestion {activeIdx + 1} of {suggestions.length}
                </span>
              </div>

              {/* Red Deletion (Original) */}
              <div className="group relative flex items-start gap-2 rounded-lg bg-rose-50 border border-rose-200 dark:bg-rose-950/40 dark:border-rose-800/40 p-3 text-xs font-mono text-rose-950 dark:text-rose-200">
                <span className="font-bold text-rose-700 dark:text-rose-400 select-none">-</span>
                <span className="line-through opacity-85 leading-relaxed">{activeSuggestion.originalText}</span>
              </div>

              {/* Green Addition (Suggested) */}
              <div className="mt-2.5 group relative flex items-start gap-2 rounded-lg bg-emerald-50 border border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-800/40 p-3 text-xs font-mono text-emerald-950 dark:text-emerald-200 shadow-xs">
                <span className="font-bold text-emerald-700 dark:text-emerald-400 select-none">+</span>
                <span className="leading-relaxed font-semibold">{activeSuggestion.suggestedText}</span>
              </div>

              {/* AI Justification Explanation */}
              <div className="mt-3 rounded-lg bg-surface-card p-3 text-xs text-muted border border-hairline flex items-start gap-2">
                <Sparkles className="h-4 w-4 text-brand-teal shrink-0 mt-0.5" />
                <span><strong className="text-ink">Rationale:</strong> {activeSuggestion.reason}</span>
              </div>

              {/* Accept / Reject Buttons */}
              <div className="mt-4 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={handleReject}
                  className="flex items-center gap-1.5 rounded-xl border border-rose-300 bg-rose-100 dark:border-rose-800 dark:bg-rose-950/40 px-3.5 py-2 text-xs font-bold text-rose-900 dark:text-rose-300 hover:bg-rose-200 dark:hover:bg-rose-900/40 transition-colors cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" /> Reject (Esc)
                </button>
                <button
                  type="button"
                  onClick={handleAccept}
                  className="flex items-center gap-1.5 rounded-xl border border-emerald-600 bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-500 transition-colors cursor-pointer shadow-xs"
                >
                  <Check className="h-3.5 w-3.5" /> Accept Edit (Tab)
                </button>
              </div>
            </motion.div>
          </AnimatePresence>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-hairline bg-surface-soft/40 py-8 text-center">
            <Check className="h-8 w-8 text-emerald-600 dark:text-emerald-400 mb-2" />
            <h4 className="text-sm font-bold text-ink">All AI Bullet Suggestions Reviewed!</h4>
            <p className="text-xs text-muted mt-1 max-w-sm leading-relaxed">All changes have been merged into your active working document.</p>
          </div>
        )}
      </div>
    </div>
  );
}
