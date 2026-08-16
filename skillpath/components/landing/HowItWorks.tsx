'use client';
// updated

import React from 'react';
import { motion } from 'framer-motion';
import { FileText, Cpu, Compass, ArrowRight } from 'lucide-react';

const steps = [
  {
    num: '01', title: 'Discover & Translate',
    desc: 'Our engine parses formal resumes alongside informal lived experience (caregiving, operations, self-study) into high-dimensional adjacent skill vectors.',
    icon: <FileText className="w-7 h-7" />, accent: '#ff4d8b',
  },
  {
    num: '02', title: 'De-bias & Bridge',
    desc: 'Matches candidates factoring accessibility (PwD), remote flexibility, and stepped bridge-role ladders with 0% career gap penalties.',
    icon: <Cpu className="w-7 h-7" />, accent: '#2DD4BF',
  },
  {
    num: '03', title: 'Audit & Connect',
    desc: 'Continuous demographic parity checks issue a certified A+ fairness report, with one-click export to SAP SuccessFactors Talent Intelligence Hub.',
    icon: <Compass className="w-7 h-7" />, accent: '#b8a4ed',
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="relative py-16 md:py-28 px-4 sm:px-8 lg:px-24 flex justify-center overflow-hidden" style={{ background: 'var(--color-canvas)' }}>
      {/* Ambient Radial Gradient Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[600px] bg-gradient-to-tr from-[#ff4d8b]/5 via-[#b8a4ed]/5 to-[#2DD4BF]/5 blur-3xl pointer-events-none -z-0" />

      <div className="max-w-[1280px] w-full relative z-10">
        <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }} className="mb-14 md:mb-20">
          <div className="flex items-center gap-4 mb-5">
            <div className="h-1 w-16 rounded" style={{ background: 'var(--color-brand-pink)', borderRadius: '2px' }} />
            <span className="font-mono text-[11px] font-black uppercase tracking-[0.18em]" style={{ color: 'var(--color-muted)' }}>The Methodology</span>
          </div>
          <h2 className="font-comico font-normal uppercase leading-[0.98] tracking-wide" style={{ fontSize: 'clamp(40px, 6vw, 72px)', color: 'var(--color-ink)' }}>
            A fair, agentic path<br />
            <span style={{ color: 'var(--color-brand-pink)' }}>from margins to mastery.</span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 relative">
          <div className="absolute top-[72px] left-[16.66%] right-[16.66%] h-[3px] hidden md:block pointer-events-none" style={{ background: 'var(--bold-border)', zIndex: 0 }} />

          {steps.map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 48 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.8, delay: i * 0.18, ease: [0.16, 1, 0.3, 1] }}
              className="relative z-10 flex flex-col"
            >
              <div
                className="flex-1 flex flex-col p-8 md:p-10 transition-transform duration-200 hover:-translate-y-1"
                style={{
                  background: 'var(--color-surface-card)',
                  border: '3px solid var(--bold-border)',
                  borderRadius: '20px',
                  boxShadow: `6px 6px 0 ${step.accent}`,
                }}
              >
                <div className="flex items-start justify-between mb-8">
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center"
                    style={{ background: step.accent, border: '3px solid var(--bold-border)', boxShadow: '4px 4px 0 var(--bold-border)', color: 'white' }}
                  >
                    {step.icon}
                  </div>
                  <span className="font-comico leading-none select-none" style={{ fontSize: '80px', color: step.accent, opacity: 0.18, lineHeight: 1 }}>
                    {step.num}
                  </span>
                </div>

                <h3 className="font-comico font-normal uppercase mb-4" style={{ fontSize: '24px', color: 'var(--color-ink)', letterSpacing: '0.02em' }}>{step.title}</h3>
                <p className="font-zodiak font-normal text-[16px] leading-relaxed flex-1" style={{ color: 'var(--color-muted)' }}>{step.desc}</p>

                <div className="mt-8 pt-5 flex items-center gap-2" style={{ borderTop: '2px solid var(--color-hairline)' }}>
                  <div className="w-2 h-2 rounded-full" style={{ background: step.accent }} />
                  <span className="font-mono text-[11px] font-black uppercase tracking-widest" style={{ color: step.accent }}>Step {step.num}</span>
                  {i < steps.length - 1 && <ArrowRight className="w-4 h-4 ml-auto" style={{ color: step.accent, opacity: 0.5 }} />}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

    </section>
  );
}
