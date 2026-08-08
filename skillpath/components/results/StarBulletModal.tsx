'use client';
// updated

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Copy, Check, X, FileText } from 'lucide-react';

interface StarBulletModalProps {
  isOpen: boolean;
  onClose: () => void;
  skill: string;
  role: string;
}

export function StarBulletModal({ isOpen, onClose, skill, role }: StarBulletModalProps) {
  const [bullets, setBullets] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  React.useEffect(() => {
    if (isOpen && skill) {
      fetchBullets();
    }
  }, [isOpen, skill]);

  async function fetchBullets() {
    setLoading(true);
    try {
      const res = await fetch('/api/generate-star-bullets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skill, role }),
      });
      if (res.ok) {
        const data = await res.json();
        setBullets(data.bullets || []);
      }
    } catch (e) {
      console.error('Failed to fetch bullets:', e);
    } finally {
      setLoading(false);
    }
  }

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" data-lenis-prevent>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-surface-card border border-hairline rounded-3xl p-6 md:p-8 max-w-xl w-full relative shadow-2xl overflow-hidden max-h-[85vh] flex flex-col"
        >
          {/* Header */}
          <div className="shrink-0 pb-3 border-b border-hairline relative">
            <button
              onClick={onClose}
              className="absolute top-0 right-0 p-2 rounded-full hover:bg-surface-soft text-muted hover:text-ink transition-colors"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-2 mb-2">
              <span className="p-2 rounded-lg bg-brand-teal/10 text-brand-teal">
                <FileText size={18} />
              </span>
              <span className="text-[11px] font-bold text-brand-teal uppercase tracking-widest">
                STAR Resume Bullets
              </span>
            </div>

            <h3 className="font-display text-title-lg text-ink">
              Resume Bullets for <span className="text-brand-teal">{skill}</span>
            </h3>
            <p className="font-sans text-body-sm text-muted mt-1">
              Quantifiable, ATS-optimized bullet points ready to paste onto your resume.
            </p>
          </div>

          {/* Scrollable Body */}
          <div
            className="flex-1 min-h-0 overflow-y-auto overscroll-contain touch-pan-y py-4 space-y-3 pr-1 scrollbar-thin scrollbar-thumb-muted/20 scrollbar-track-transparent"
            data-lenis-prevent
          >
            {loading ? (
              <div className="py-12 text-center">
                <div className="w-8 h-8 border-2 border-brand-teal border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-body-sm text-muted">Architecting STAR bullets for {skill}...</p>
              </div>
            ) : (
              <div className="space-y-3">
                {bullets.map((bullet, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl bg-canvas border border-hairline hover:border-brand-teal/30 transition-all flex items-start justify-between gap-4 group"
                  >
                    <p className="text-body-sm text-ink/90 font-sans leading-relaxed">
                      • {bullet}
                    </p>
                    <button
                      onClick={() => handleCopy(bullet, idx)}
                      className="p-2 rounded-lg bg-surface-soft hover:bg-brand-teal/10 text-muted hover:text-brand-teal transition-colors shrink-0 cursor-pointer"
                      title="Copy bullet"
                    >
                      {copiedIndex === idx ? (
                        <Check size={16} className="text-brand-teal" />
                      ) : (
                        <Copy size={16} />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="pt-4 border-t border-hairline flex justify-end shrink-0">
            <button
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl bg-primary text-on-primary font-sans font-semibold text-button hover:bg-primary-active transition-colors cursor-pointer"
            >
              Done
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
