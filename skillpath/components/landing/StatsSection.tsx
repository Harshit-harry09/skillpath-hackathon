'use client';
// updated

import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Users, Clock, Star, Zap, BarChart3 } from 'lucide-react';

const stats = [
  { val: '5,000+', label: 'Engineers Onboarded', sub: 'This month alone', icon: <Users className="w-5 h-5" />, accent: '#ff4d8b' },
  { val: '99.4%', label: 'Analysis Accuracy', sub: 'vs. real job postings', icon: <BarChart3 className="w-5 h-5" />, accent: '#2DD4BF' },
  { val: '< 1s', label: 'Time to Results', sub: 'Subsecond inference', icon: <Clock className="w-5 h-5" />, accent: '#e8b94a' },
  { val: '30+', label: 'Career Paths', sub: 'Across all tech domains', icon: <TrendingUp className="w-5 h-5" />, accent: '#b8a4ed' },
  { val: '8 wks', label: 'Avg. Time to Hired', sub: 'Following our roadmap', icon: <Zap className="w-5 h-5" />, accent: '#ff6b5a' },
  { val: 'Free', label: 'Forever. Always.', sub: 'No paywalls ever', icon: <Star className="w-5 h-5" />, accent: '#a4d4c5' },
];

export function StatsSection() {
  return (
    <section
      className="relative py-16 md:py-24 px-4 sm:px-8 lg:px-24 flex justify-center overflow-hidden"
      style={{ background: 'var(--section-dark-bg)' }}
    >
      {/* Grid pattern */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.04]"
        style={{ backgroundImage: `linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)`, backgroundSize: '48px 48px' }}
      />
      <div className="absolute top-0 left-0 right-0 h-1" style={{ background: '#ff4d8b' }} />

      <div className="max-w-[1280px] w-full relative z-10">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }} className="mb-14 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="h-1 w-10 rounded" style={{ background: '#ff4d8b', borderRadius: '2px' }} />
              <span className="font-mono text-[11px] font-black uppercase tracking-[0.18em]" style={{ color: 'rgba(255,255,255,0.3)' }}>By the numbers</span>
            </div>
            <h2 className="font-black text-white leading-[0.92]" style={{ fontSize: 'clamp(36px, 5vw, 68px)', letterSpacing: '-0.04em' }}>
              Numbers that<br /><span style={{ color: '#ff4d8b' }}>don't lie.</span>
            </h2>
          </div>
          <p style={{ color: 'rgba(255,255,255,0.4)' }} className="font-medium text-[15px] max-w-xs leading-relaxed md:text-right">
            Real data from real engineers who used SkillPath to land their dream roles.
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
              className="relative flex flex-col p-6 md:p-8"
              style={{ background: 'rgba(255,255,255,0.04)', border: '2px solid rgba(255,255,255,0.08)', borderRadius: '16px', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06)' }}
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-5 flex-shrink-0" style={{ background: s.accent, color: '#0a0a0a', border: '2px solid rgba(255,255,255,0.1)', boxShadow: `0 0 20px ${s.accent}44` }}>
                {s.icon}
              </div>
              <span className="font-black leading-none block mb-2" style={{ fontSize: 'clamp(36px, 5vw, 60px)', color: '#fff', letterSpacing: '-0.04em' }}>{s.val}</span>
              <span className="font-black text-[14px] block leading-tight mb-1" style={{ color: s.accent }}>{s.label}</span>
              <span className="font-mono text-[10px] font-bold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.25)' }}>{s.sub}</span>
              <div className="absolute top-4 right-4 w-2 h-2 rounded-full" style={{ background: s.accent, opacity: 0.5 }} />
            </motion.div>
          ))}
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-1" style={{ background: '#2DD4BF' }} />
    </section>
  );
}
