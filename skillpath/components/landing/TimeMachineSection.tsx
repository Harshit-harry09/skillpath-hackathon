'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Hourglass, Sparkles, ArrowRight, TrendingUp, Zap, Trophy, Bot, CheckCircle2, Sliders } from 'lucide-react';

export function TimeMachineSection() {
  const router = useRouter();

  return (
    <section className="py-12 md:py-20 px-4 sm:px-6 lg:px-16 max-w-7xl mx-auto w-full relative z-10">
      <div className="bg-surface-card/80 dark:bg-slate-900/60 border border-white/10 dark:border-white/5 rounded-[28px] sm:rounded-[36px] md:rounded-[48px] p-5 sm:p-8 md:p-14 shadow-2xl relative overflow-hidden backdrop-blur-xl border-t border-t-white/20">
        {/* Background glowing accents */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand-teal/15 rounded-full blur-[130px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-brand-pink/15 rounded-full blur-[130px] pointer-events-none" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center relative z-10">

          {/* Left Column: Heading & Feature Details */}
          <div className="lg:col-span-6 space-y-5 sm:space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 sm:px-4 py-1.5 rounded-full bg-brand-pink/10 border border-brand-pink/30 text-[10px] sm:text-[11px] font-mono text-brand-pink font-bold tracking-widest uppercase shadow-sm">
              <Hourglass size={14} className="animate-pulse text-amber-400" />
              Resume Time Machine · 3-Year Career Simulator
            </div>

            <h2 className="font-display text-2xl sm:text-4xl md:text-5xl font-extrabold text-ink tracking-tight leading-tight">
              Fast-forward your salary & <br className="hidden sm:inline" />
              <span className="bg-gradient-to-r from-brand-pink via-purple-400 to-brand-teal bg-clip-text text-transparent">
                seniority trajectory.
              </span>
            </h2>

            <p className="font-sans text-muted text-sm sm:text-lg leading-relaxed font-medium">
              Upload your resume and select target roles. Our <span className="font-bold text-ink">Hybrid AI (50% Resume + 50% Live Market Demand)</span> projects your 36-month compensation curve and unlocks advanced career titles.
            </p>

            {/* Feature Bullets */}
            <div className="space-y-3 pt-1">
              <div className="flex items-center gap-3 text-xs sm:text-sm font-semibold text-ink">
                <div className="w-6 h-6 rounded-full bg-teal-500/20 text-brand-teal flex items-center justify-center shrink-0 border border-teal-500/30">
                  <CheckCircle2 size={14} />
                </div>
                <span>50% User Resume Skills + 50% AI Live Market Demand Benchmarks</span>
              </div>
              <div className="flex items-center gap-3 text-xs sm:text-sm font-semibold text-ink">
                <div className="w-6 h-6 rounded-full bg-brand-pink/20 text-brand-pink flex items-center justify-center shrink-0 border border-brand-pink/30">
                  <CheckCircle2 size={14} />
                </div>
                <span>Interactive Skill Accelerators — toggle skills to bend your salary curve upward</span>
              </div>
              <div className="flex items-center gap-3 text-xs sm:text-sm font-semibold text-ink">
                <div className="w-6 h-6 rounded-full bg-amber-400/20 text-amber-400 flex items-center justify-center shrink-0 border border-amber-400/30">
                  <CheckCircle2 size={14} />
                </div>
                <span>Unlockable Career Titles (Senior, Staff Specialist, Principal Lead)</span>
              </div>
            </div>

            {/* CTA Button */}
            <div className="pt-2 sm:pt-4">
              <button
                onClick={() => router.push('/time-machine')}
                className="w-full sm:w-auto bg-brand-pink text-white font-bold text-base px-8 py-4 rounded-2xl hover:shadow-[0_0_30px_rgba(236,72,153,0.4)] active:scale-95 transition-all flex items-center justify-center gap-3 shadow-lg tactile-button group"
              >
                <Hourglass size={18} className="animate-pulse" />
                <span>Launch Time Machine</span>
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>

          {/* Right Column: Visual Preview Card */}
          <div className="lg:col-span-6">
            <div className="bg-canvas/90 border border-hairline rounded-3xl p-6 shadow-xl space-y-5 relative backdrop-blur-md">

              {/* Card Header Badge */}
              <div className="flex items-center justify-between border-b border-hairline/60 pb-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-teal-400 animate-ping" />
                  <span className="text-xs font-mono font-bold text-ink uppercase tracking-wider">
                    36-Month Trajectory Simulator
                  </span>
                </div>
                <span className="text-[11px] font-mono font-bold text-teal-400 bg-teal-500/10 px-3 py-1 rounded-full border border-teal-500/20">
                  +$45,000/yr Max Boost
                </span>
              </div>

              {/* Salary Curve Preview */}
              <div className="space-y-3">
                <div className="flex justify-between text-[11px] font-mono font-bold text-muted uppercase tracking-wider">
                  <span>Horizon & Title</span>
                  <span>Projected Salary</span>
                </div>

                {[
                  { year: 'Now (Year 0)', sal: '$95,000/yr', title: 'Software Engineer', width: '45%' },
                  { year: 'Year 1 (12M)', sal: '$128,000/yr', title: 'Senior Engineer', width: '65%' },
                  { year: 'Year 2 (24M)', sal: '$162,000/yr', title: 'Staff Specialist', width: '82%' },
                  { year: 'Year 3 (36M)', sal: '$205,000/yr', title: 'Principal Lead', width: '100%' }
                ].map((item, i) => (
                  <div key={item.year} className="p-3 rounded-2xl bg-surface-soft/80 border border-hairline space-y-1.5 hover:border-brand-teal/40 transition-colors">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-ink">{item.year} · <span className="text-muted font-mono font-normal">{item.title}</span></span>
                      <span className="font-mono font-bold text-brand-teal">{item.sal}</span>
                    </div>
                    <div className="w-full bg-hairline/40 h-2 rounded-full overflow-hidden">
                      <div className="bg-gradient-to-r from-brand-pink via-purple-400 to-brand-teal h-full rounded-full" style={{ width: item.width }} />
                    </div>
                  </div>
                ))}
              </div>

              {/* Mini AI Strategist Note */}
              <div className="p-3.5 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center gap-3 text-xs font-medium text-ink">
                <Bot size={16} className="text-brand-teal shrink-0" />
                <span>AI Recommendation: Mastering System Architecture + AI Agents pushes you into the 92nd percentile!</span>
              </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  );
}

