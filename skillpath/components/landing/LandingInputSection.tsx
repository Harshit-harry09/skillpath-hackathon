'use client';
// updated

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Sparkles, ArrowRight, Cpu, Terminal, ChevronRight } from 'lucide-react';

const sampleRoles = ['Full-Stack AI Engineer', 'LLM Systems Architect', 'Senior ML Infrastructure', 'Principal Product Engineer'];

export function LandingInputSection() {
  const [jd, setJd] = useState('');
  const router = useRouter();

  const handleStartWithText = (textToSubmit: string) => {
    const finalJd = textToSubmit.trim();
    if (!finalJd) return;
    try {
      sessionStorage.setItem('pending_jd', finalJd);
    } catch {
      // Best-effort storage fallback
    }
    router.push('/analyze');
  };

  return (
    <section id="analyze" className="relative py-16 md:py-28 px-4 sm:px-8 lg:px-24 flex justify-center" style={{ background: 'var(--color-canvas)' }}>
      <div className="max-w-[1280px] w-full grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-start">
        {/* Left */}
        <motion.div initial={{ opacity: 0, x: -32 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }} className="lg:col-span-5 space-y-6">
          <div>
            <div className="flex items-center gap-3 mb-5">
              <div className="h-1 w-10 rounded" style={{ background: '#2DD4BF', borderRadius: '2px' }} />
              <span className="font-mono text-[11px] font-black uppercase tracking-[0.18em]" style={{ color: 'var(--color-muted)' }}>Gap Engine</span>
            </div>
            <h2 className="font-black leading-[0.95] tracking-tighter" style={{ fontSize: 'clamp(36px, 5vw, 62px)', color: 'var(--color-ink)', letterSpacing: '-0.04em' }}>
              Bridge your<br />skill gap<br /><span style={{ color: '#2DD4BF' }}>in real time.</span>
            </h2>
          </div>

          <p className="text-[16px] font-medium leading-relaxed" style={{ color: 'var(--color-muted)', maxWidth: '380px' }}>
            Paste any target Job Description. Our deep learning engine extracts missing competencies and constructs your step-by-step career path.
          </p>

          <div className="space-y-3">
            <span className="font-mono text-[10px] font-black uppercase tracking-widest block" style={{ color: 'var(--color-muted)' }}>Quick-select a target role:</span>
            <div className="flex flex-wrap gap-2">
              {sampleRoles.map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => {
                    setJd(`Targeting role: ${role}. Requires core engineering, architecture, and deployment standards.`);
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-2 font-mono text-[11px] font-bold uppercase tracking-wide transition-all duration-150 active:translate-y-[1px] cursor-pointer hover:border-brand-pink"
                  style={{ background: 'var(--color-surface-soft)', color: 'var(--color-ink)', border: '2px solid var(--bold-border)', borderRadius: '8px', boxShadow: '2px 2px 0 var(--bold-border)' }}
                >
                  <ChevronRight className="w-3 h-3" />{role}
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Right: Input Terminal */}
        <motion.div initial={{ opacity: 0, y: 32 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }} className="lg:col-span-7">
          <div style={{ background: 'var(--color-surface-card)', border: '3px solid var(--bold-border)', borderRadius: '20px', boxShadow: '8px 8px 0 var(--bold-border)', overflow: 'hidden' }}>
            {/* Terminal header */}
            <div className="flex items-center justify-between px-5 py-3.5" style={{ background: 'var(--color-ink)', borderBottom: '3px solid var(--bold-border)' }}>
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4" style={{ color: '#2DD4BF' }} />
                <span className="font-mono text-[11px] font-black uppercase tracking-widest" style={{ color: 'var(--color-canvas)' }}>Target JD Evaluator · AI Parser</span>
              </div>
              <div className="px-2.5 py-1 rounded-full font-mono text-[10px] font-black" style={{ background: '#2DD4BF22', color: '#2DD4BF', border: '1px solid #2DD4BF44' }}>READY</div>
            </div>

            <div className="p-5 md:p-7">
              <div
                className="relative"
                style={{ border: '2px solid var(--color-hairline)', borderRadius: '12px', boxShadow: 'inset 3px 3px 8px rgba(0,0,0,0.06)', background: 'var(--color-canvas)', transition: 'border-color 0.2s' }}
              >
                <div className="absolute left-0 top-0 bottom-0 w-10 flex flex-col pt-4 items-center opacity-30 pointer-events-none select-none" style={{ borderRight: '1px solid var(--color-hairline)' }}>
                  {Array.from({ length: 10 }).map((_, i) => (
                    <span key={i} className="font-mono text-[10px] leading-7" style={{ color: 'var(--color-muted)' }}>{i + 1}</span>
                  ))}
                </div>
                <label htmlFor="jd-input" className="sr-only">Target Job Description</label>
                <textarea
                  id="jd-input"
                  placeholder="Paste target Job Description, role requirements, or expectations here…"
                  className="w-full min-h-[260px] resize-none font-mono text-[14px] leading-7 bg-transparent rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-pink"
                  style={{ paddingLeft: '52px', paddingTop: '16px', paddingRight: '16px', paddingBottom: '16px', color: 'var(--color-ink)' }}
                  value={jd}
                  onChange={(e) => setJd(e.target.value)}
                  spellCheck={false}
                  autoComplete="off"
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-4 mt-5 pt-5" style={{ borderTop: '2px solid var(--color-hairline)' }}>
                <div className="flex items-center gap-2 text-[12px] font-mono font-bold" style={{ color: 'var(--color-muted)' }}>
                  <Sparkles className="w-4 h-4" style={{ color: '#ff4d8b' }} />
                  <span>{jd.length} chars · instant skill match &amp; gap analysis</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleStartWithText(jd)}
                  disabled={!jd.trim()}
                  className="flex items-center gap-2.5 font-black uppercase tracking-wider transition-all duration-150 active:translate-y-[2px] active:shadow-none disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none disabled:translate-y-0"
                  style={{
                    background: jd.trim() ? '#2DD4BF' : 'var(--color-muted)',
                    color: '#0a0a0a',
                    fontSize: '13px',
                    letterSpacing: '0.08em',
                    padding: '14px 28px',
                    borderRadius: '10px',
                    border: '2px solid var(--bold-border)',
                    boxShadow: jd.trim() ? '4px 4px 0 var(--bold-border)' : 'none',
                  }}
                >
                  <Cpu className="w-4 h-4" />Generate Roadmap<ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
