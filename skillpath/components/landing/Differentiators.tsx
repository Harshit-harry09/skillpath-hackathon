'use client';

import React from 'react';
import { motion } from 'framer-motion';

const features = [
  { num: '01', title: 'MVC Profile', desc: '4 skills. Not 40. We find the ones that actually get you callbacks — ranked by market demand and salary delta.', accent: '#ff4d8b' },
  { num: '02', title: 'Ready-by Date', desc: 'Not "beginner to advanced." A specific date. Week-by-week. Start today, land the role by July 3.', accent: '#2DD4BF' },
  { num: '03', title: 'Free. All of It.', desc: 'No subscriptions. No paywalls. Every resource we link is free. Forever. No catch.', accent: '#b8a4ed' },
];

export function Differentiators() {
  return (
    <section id="features" className="relative pt-8 pb-16 md:pt-12 md:pb-28 px-4 sm:px-8 lg:px-24 flex justify-center" style={{ background: 'var(--color-canvas)' }}>
      <div className="max-w-[1280px] w-full">
        <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }} className="mb-12 md:mb-20 flex items-end justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="h-1 w-10 rounded" style={{ background: 'var(--color-brand-pink)', borderRadius: '2px' }} />
              <span className="font-mono text-[11px] font-black uppercase tracking-[0.18em]" style={{ color: 'var(--color-muted)' }}>What makes us different</span>
            </div>
            <h2 className="font-black leading-[0.95] tracking-tighter" style={{ fontSize: 'clamp(36px, 5vw, 64px)', color: 'var(--color-ink)', letterSpacing: '-0.04em' }}>
              Built different.<br /><span style={{ color: 'var(--color-brand-pink)' }}>By design.</span>
            </h2>
          </div>
        </motion.div>

        <div>
          {features.map((feat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -24 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.7, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col md:flex-row items-start md:items-center gap-6 md:gap-12 py-10 md:py-12 relative"
              style={{ borderTop: `3px solid var(--bold-border)` }}
            >
              <div className="font-black leading-none select-none flex-shrink-0" style={{ fontSize: 'clamp(64px, 8vw, 110px)', color: feat.accent, letterSpacing: '-0.05em', opacity: 0.15, lineHeight: 1, minWidth: '120px', textAlign: 'right' }}>
                {feat.num}
              </div>
              <div className="flex-shrink-0 hidden md:block" style={{ width: '4px', height: '80px', background: feat.accent, borderRadius: '2px', boxShadow: `0 0 20px ${feat.accent}66` }} />
              <div className="flex-1 space-y-3">
                <h3 className="font-black leading-none tracking-tight" style={{ fontSize: 'clamp(28px, 4vw, 44px)', color: 'var(--color-ink)', letterSpacing: '-0.03em' }}>{feat.title}</h3>
                <p className="text-[16px] font-medium leading-relaxed max-w-xl" style={{ color: 'var(--color-muted)' }}>{feat.desc}</p>
              </div>
              <div className="hidden lg:flex items-center gap-2 px-4 py-2 font-mono text-[11px] font-black uppercase tracking-widest flex-shrink-0" style={{ border: `2px solid ${feat.accent}`, borderRadius: '8px', color: feat.accent, boxShadow: `3px 3px 0 ${feat.accent}` }}>
                {feat.num}
              </div>
            </motion.div>
          ))}
          <div style={{ borderTop: '3px solid var(--bold-border)' }} />
        </div>
      </div>
    </section>
  );
}
