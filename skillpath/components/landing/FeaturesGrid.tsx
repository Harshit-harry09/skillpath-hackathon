'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Brain, Target, Map, Building, Clock, Zap } from 'lucide-react';

const features = [
  { icon: <Brain className="w-6 h-6" />, title: 'Instant Profile Analysis', desc: 'Upload your resume and get a gap score against real-world job descriptions in under a second.', accent: '#ff4d8b', num: '01' },
  { icon: <Target className="w-6 h-6" />, title: 'The 80/20 Curriculum', desc: 'Learn only the high-impact skills that appear in 80% of top-tier company JDs. Skip the rest.', accent: '#2DD4BF', num: '02' },
  { icon: <Map className="w-6 h-6" />, title: 'Custom Learning Roadmap', desc: 'Generate a week-by-week plan with curated resources, structured by market priority not hype.', accent: '#b8a4ed', num: '03' },
  { icon: <Building className="w-6 h-6" />, title: 'Company Calibration', desc: 'Tailor your prep for Startups, Scale-ups, or Enterprise. Same role, totally different skill set.', accent: '#e8b94a', num: '04' },
  { icon: <Clock className="w-6 h-6" />, title: 'Time-to-Ready Countdown', desc: "Stop guessing. Get a precise calendar date for when you'll be interview-ready. No vague timelines.", accent: '#ff6b5a', num: '05' },
  { icon: <Zap className="w-6 h-6" />, title: 'Multi-Role Intelligence', desc: 'Support for 30+ career paths — from DevOps to AI Research, Product, and Finance Engineering.', accent: '#a4d4c5', num: '06' },
];

export function FeaturesGrid() {
  return (
    <section className="relative py-16 md:py-28 px-4 sm:px-8 lg:px-24 flex justify-center" style={{ background: 'var(--color-canvas)' }}>
      <div className="absolute top-0 left-0 right-0 h-1" style={{ background: 'var(--bold-border)' }} />

      <div className="max-w-[1280px] w-full">
        <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }} className="mb-14 md:mb-20">
          <div className="flex items-center gap-3 mb-5">
            <div className="h-1 w-10 rounded" style={{ background: '#2DD4BF' }} />
            <span className="font-mono text-[11px] font-black uppercase tracking-[0.18em]" style={{ color: 'var(--color-muted)' }}>Core Features</span>
          </div>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <h2 className="font-black leading-[0.92] tracking-tighter" style={{ fontSize: 'clamp(36px, 5.5vw, 72px)', color: 'var(--color-ink)', letterSpacing: '-0.04em' }}>
              Everything you need<br /><span style={{ color: '#2DD4BF' }}>to land the job.</span>
            </h2>
            <p className="font-medium text-[15px] max-w-xs leading-relaxed" style={{ color: 'var(--color-muted)' }}>
              Six precision tools, zero fluff. Built for engineers who want results, not content.
            </p>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.7, delay: i * 0.07, ease: [0.16, 1, 0.3, 1] }}
              className="group flex flex-col p-7 md:p-8 relative overflow-hidden transition-transform duration-200 hover:-translate-y-1"
              style={{ background: 'var(--color-surface-card)', border: '2px solid var(--bold-border)', borderRadius: '18px', boxShadow: `4px 4px 0 ${f.accent}` }}
            >
              <span className="absolute top-4 right-5 font-black select-none pointer-events-none" style={{ fontSize: '72px', lineHeight: 1, color: f.accent, opacity: 0.1, letterSpacing: '-0.05em' }}>{f.num}</span>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-6 relative z-10" style={{ background: f.accent, border: '2px solid var(--bold-border)', boxShadow: `3px 3px 0 var(--bold-border)`, color: '#fff' }}>
                {f.icon}
              </div>
              <h3 className="font-black mb-3 leading-tight relative z-10" style={{ fontSize: '20px', color: 'var(--color-ink)', letterSpacing: '-0.02em' }}>{f.title}</h3>
              <p className="font-medium text-[14px] leading-relaxed flex-1 relative z-10" style={{ color: 'var(--color-muted)' }}>{f.desc}</p>
              <div className="mt-6 h-1 rounded-full" style={{ background: f.accent, width: '32px', opacity: 0.6 }} />
            </motion.div>
          ))}
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-1" style={{ background: 'var(--bold-border)' }} />
    </section>
  );
}
