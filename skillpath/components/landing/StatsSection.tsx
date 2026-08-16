'use client';
// updated

import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Users, Clock, Star, Zap, BarChart3 } from 'lucide-react';

const stats = [
  { val: '$5.5T', label: 'Global Skills Gap', sub: 'IDC Enterprise Loss Risk', icon: <TrendingUp className="w-5 h-5" />, accent: '#ff4d8b' },
  { val: '+56%', label: 'AI Fluency Premium', sub: 'PwC 2026 Wage Benchmark', icon: <Zap className="w-5 h-5" />, accent: '#2DD4BF' },
  { val: '56.35%', label: 'India Employability', sub: 'India Skills Report 2026', icon: <BarChart3 className="w-5 h-5" />, accent: '#e8b94a' },
  { val: '59%', label: 'Workforce Needs Reskilling', sub: 'WEF 120M Redundancy Risk', icon: <Users className="w-5 h-5" />, accent: '#b8a4ed' },
  { val: '10 / 10', label: 'Fairness Dimensions Audited', sub: 'Agent 9 Bias Governance', icon: <Star className="w-5 h-5" />, accent: '#ff6b5a' },
  { val: '0%', label: 'Career Gap Penalty', sub: '100% Skills-First Accreditation', icon: <Clock className="w-5 h-5" />, accent: '#a4d4c5' },
];

export function StatsSection() {
  return (
    <section
      className="relative py-16 md:py-24 px-4 sm:px-8 lg:px-24 flex justify-center overflow-hidden"
      style={{ background: 'var(--color-canvas)' }}
    >
      {/* Ambient Radial Gradient Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[500px] bg-gradient-to-r from-[#2DD4BF]/5 via-[#e8b94a]/5 to-[#ff4d8b]/5 blur-3xl pointer-events-none -z-0" />

      <div className="max-w-[1280px] w-full relative z-10">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }} className="mb-14 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="h-1 w-10 rounded" style={{ background: '#ff4d8b', borderRadius: '2px' }} />
              <span className="font-mono text-[11px] font-black uppercase tracking-[0.18em]" style={{ color: 'var(--color-muted)' }}>Macroeconomic Reality</span>
            </div>
            <h2 className="font-comico font-normal uppercase leading-[0.98] tracking-wide" style={{ fontSize: 'clamp(36px, 5vw, 68px)', color: 'var(--color-ink)' }}>
              Why this matters<br /><span style={{ color: '#ff4d8b' }}>right now.</span>
            </h2>
          </div>
          <p style={{ color: 'var(--color-muted)' }} className="font-zodiak text-[16px] font-normal max-w-sm leading-relaxed md:text-right">
            The global workforce is undergoing its most significant structural shift since industrialization. Data shows a story of simultaneous abundance and exclusion.
          </p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {stats.map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.7, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
              className="relative flex flex-col p-6 md:p-8 transition-all duration-300 hover:scale-[1.02] cursor-default"
              style={{
                background: 'var(--color-surface-card)',
                border: '2px solid var(--bold-border)',
                borderRadius: '16px',
                boxShadow: `4px 4px 0 ${s.accent}`,
              }}
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-5 flex-shrink-0" style={{ background: s.accent, color: '#fff', border: '2px solid var(--bold-border)', boxShadow: `2px 2px 0 var(--bold-border)` }}>
                {s.icon}
              </div>
              <span className="font-comico leading-none block mb-2" style={{ fontSize: 'clamp(32px, 4.5vw, 56px)', color: 'var(--color-ink)' }}>{s.val}</span>
              <span className="font-comico font-normal uppercase tracking-wide text-[14px] block leading-tight mb-1" style={{ color: s.accent }}>{s.label}</span>
              <span className="font-zodiak text-[13px] font-normal" style={{ color: 'var(--color-muted)' }}>{s.sub}</span>
              <div className="absolute top-4 right-4 w-2 h-2 rounded-full" style={{ background: s.accent, opacity: 0.6 }} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
