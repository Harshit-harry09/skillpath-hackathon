'use client';
// updated

import React, { useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, useScroll } from 'framer-motion';
import { ArrowRight, Zap, BarChart3, Brain, TrendingUp } from 'lucide-react';
import { LinePath } from './LinePath';

export function Hero() {
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end end'],
  });

  const skills = [
    { label: 'React / Next.js', score: 92, color: '#ff4d8b' },
    { label: 'System Design', score: 67, color: '#e8b94a' },
    { label: 'ML Pipelines', score: 44, color: '#b8a4ed' },
    { label: 'LLM Fine-Tuning', score: 28, color: '#2DD4BF' },
  ];

  return (
    <section
      ref={ref}
      style={{ transform: 'translateZ(0)', contain: 'content', background: 'var(--color-canvas)' }}
      className="mx-auto relative flex min-h-[120vh] w-full flex-col items-center justify-between overflow-hidden px-4 pt-6 md:pt-10 text-[#1F3A4B] dark:text-[#FAFDEE] selection:bg-[#C2F84F] selection:text-[#1F3A4B] transition-colors duration-300"
    >
      {/* Ambient Radial Gradient Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-gradient-to-b from-[#2DD4BF]/10 via-[#ff4d8b]/5 to-transparent blur-3xl pointer-events-none -z-0" />
      {/* Background SVG Scroll Stroke - Right */}
      <LinePath
        className="absolute -right-[28%] top-0 z-0 pointer-events-none opacity-20 md:opacity-35 max-w-[1200px] text-[#1F3A4B] dark:text-[#C2F84F]"
        scrollYProgress={scrollYProgress}
      />

      {/* Background SVG Scroll Stroke - Left (Mirrored) */}
      <LinePath
        className="absolute -left-[28%] top-0 z-0 pointer-events-none opacity-20 md:opacity-35 max-w-[1200px] text-[#1F3A4B] dark:text-[#C2F84F]"
        scrollYProgress={scrollYProgress}
        mirrored={true}
      />

      {/* Main Hero Header Block */}
      <div className="relative z-10 flex w-full max-w-4xl flex-col items-center justify-center gap-4 text-center pt-2 md:pt-4">
        
        {/* Centerpiece: skillpath at top in Britney font with smooth entrance */}
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: -12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="relative flex items-center justify-center select-none"
        >
          <div className="relative inline-block">
            <span
              style={{ fontFamily: "'Britney', cursive, serif" }}
              className="text-7xl sm:text-9xl md:text-[8.5rem] lg:text-[10rem] font-normal tracking-tight text-[#1F3A4B] dark:text-white leading-none inline-block drop-shadow-[0_8px_30px_rgba(31,58,75,0.08)] dark:drop-shadow-[0_8px_35px_rgba(255,255,255,0.12)]"
            >
              skillpath
            </span>
            <span className="absolute -top-1 -right-3 text-[#ff4d8b] animate-pulse text-2xl font-mono select-none">✦</span>
          </div>
        </motion.div>

        {/* Neural Career Intelligence Pill */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <span className="inline-flex items-center gap-2 px-3.5 py-1 text-[11px] font-mono font-bold uppercase tracking-[0.18em] bg-[#1F3A4B] dark:bg-[#111116] text-[#C2F84F] border border-[#1F3A4B]/20 dark:border-[#C2F84F]/30 rounded-full shadow-[0_2px_12px_rgba(31,58,75,0.12)] dark:shadow-[0_2px_16px_rgba(194,248,79,0.12)]">
            <span className="flex h-1.5 w-1.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#C2F84F] opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#C2F84F]" />
            </span>
            Neural Career Intelligence
          </span>
        </motion.div>

        {/* Simple, Cool & Deep Tagline */}
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          style={{ fontFamily: "'Zodiak', Georgia, serif" }}
          className="relative z-10 text-xl sm:text-2xl md:text-3xl text-[#1F3A4B]/90 dark:text-slate-200 max-w-2xl leading-relaxed pt-2"
        >
          Your potential isn't in your pedigree. <br className="hidden sm:inline" />
          <span className="bg-gradient-to-r from-[#ff4d8b] via-[#b8a4ed] to-[#2DD4BF] bg-clip-text text-transparent font-medium">
            It's in your trajectory.
          </span>
        </motion.p>

        {/* Action CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-wrap items-center justify-center gap-4 pt-2 relative z-10"
        >
          <button
            onClick={() => router.push('/analyze')}
            className="group flex items-center gap-2 font-comico uppercase tracking-wider text-xs px-5 py-2.5 rounded-lg bg-[#1F3A4B] text-[#FAFDEE] dark:bg-[#C2F84F] dark:text-[#1F3A4B] border-2 border-[#1F3A4B] dark:border-[#C2F84F] shadow-[4px_4px_0_#ff4d8b] hover:shadow-[5px_5px_0_#ff4d8b] transition-all duration-150 active:translate-y-[2px] active:shadow-none"
          >
            <Zap className="w-3.5 h-3.5 fill-current text-[#C2F84F] dark:text-[#1F3A4B]" />
            Analyze Resume
            <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
          </button>

          <button
            onClick={() => {
              const el = document.getElementById('explore');
              if (el) {
                el.scrollIntoView({ behavior: 'smooth' });
              } else {
                router.push('/explore');
              }
            }}
            className="flex items-center gap-2 font-comico uppercase tracking-wider text-xs px-5 py-2.5 rounded-lg bg-transparent text-[#1F3A4B] dark:text-white border-2 border-[#1F3A4B] dark:border-slate-700 shadow-[4px_4px_0_#b8a4ed] dark:shadow-[4px_4px_0_#C2F84F] hover:bg-[#1F3A4B]/5 dark:hover:bg-white/10 transition-all duration-150 active:translate-y-[2px] active:shadow-none"
          >
            Explore Roles
          </button>
        </motion.div>

        {/* Trust Badges */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="flex items-center justify-center gap-6 sm:gap-12 pt-6 w-full max-w-lg border-t-2 border-[#1F3A4B]/15 dark:border-slate-800 mt-4"
        >
          {[
            { val: '5,000+', label: 'Engineers' },
            { val: '99.4%', label: 'Accuracy' },
            { val: '< 1s', label: 'Analysis' },
          ].map((s, i) => (
            <React.Fragment key={i}>
              <div className="flex flex-col items-center">
                <span className="font-comico text-xl sm:text-2xl leading-none text-[#1F3A4B] dark:text-white tracking-wide">{s.val}</span>
                <span className="text-[11px] font-zodiak font-bold uppercase tracking-widest text-[#1F3A4B]/70 dark:text-slate-400 mt-1">{s.label}</span>
              </div>
              {i < 2 && <div className="w-[2px] h-8 bg-[#1F3A4B]/20 dark:bg-slate-800" />}
            </React.Fragment>
          ))}
        </motion.div>
      </div>

      {/* Middle Interactive Instrument Card */}
      <div className="relative z-10 w-full max-w-4xl my-12">
        <div
          className="w-full bg-[#1F3A4B] dark:bg-[#111116] text-[#FAFDEE] rounded-3xl p-6 sm:p-8 border-4 border-[#1F3A4B] dark:border-slate-800 shadow-[10px_10px_0_#1F3A4B] dark:shadow-[10px_10px_0_#C2F84F]"
        >
          <div className="flex items-center justify-between pb-4 border-b border-[#FAFDEE]/20 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#ff4d8b]" />
              <div className="w-3 h-3 rounded-full bg-[#e8b94a]" />
              <div className="w-3 h-3 rounded-full bg-[#C2F84F]" />
            </div>
            <span className="font-mono text-[11px] font-bold uppercase tracking-widest text-[#FAFDEE]/80 dark:text-slate-300">
              SKILLPATH · AI BENCHMARK ENGINE
            </span>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-[#C2F84F] animate-pulse" />
              <span className="font-mono text-[10px] text-[#C2F84F] font-bold">LIVE</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 py-6 border-b border-[#FAFDEE]/20 dark:border-slate-800 text-center sm:text-left">
            {[
              { label: 'GAP SCORE', value: '47%', icon: <BarChart3 className="w-4 h-4 text-[#ff4d8b]" /> },
              { label: 'MARKET FIT', value: '6.2x', icon: <TrendingUp className="w-4 h-4 text-[#e8b94a]" /> },
              { label: 'SKILLS FOUND', value: '23', icon: <Brain className="w-4 h-4 text-[#C2F84F]" /> },
            ].map((m, i) => (
              <div key={i} className="flex flex-col gap-1">
                <div className="flex items-center justify-center sm:justify-start gap-1.5">
                  {m.icon}
                  <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#FAFDEE]/70 dark:text-slate-400">{m.label}</span>
                </div>
                <span className="font-comico text-2xl sm:text-3xl tracking-tight">{m.value}</span>
              </div>
            ))}
          </div>

          {/* Skill Bars */}
          <div className="pt-6 space-y-3.5">
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-widest text-[#FAFDEE]/70 dark:text-slate-400 font-zodiak">
              <span>Skill Gap Breakdown</span>
              <span className="text-[#ff4d8b]">Priority missing</span>
            </div>
            {skills.map((s, i) => (
              <div key={i} className="space-y-1.5">
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="font-zodiak">{s.label}</span>
                  <span style={{ color: s.color }} className="font-comico">{s.score}%</span>
                </div>
                <div className="h-2.5 rounded-full bg-white/10 overflow-hidden relative">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${s.score}%` }}
                    transition={{ duration: 1, delay: 0.2 + i * 0.1 }}
                    className="h-full rounded-full"
                    style={{ background: s.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Sleek Bottom Section with SkillPath Branding & Info */}
      <div className="relative z-10 w-full max-w-6xl rounded-3xl bg-[#1F3A4B] dark:bg-[#111116] text-[#FAFDEE] p-8 sm:p-12 mb-10 border-2 border-[#1F3A4B]/20 dark:border-slate-800 shadow-2xl">
        <h2 className="text-center text-[11vw] sm:text-[12vw] font-britney font-normal lowercase leading-[0.9] tracking-tight text-[#FAFDEE] select-none">
          skillpath<span className="text-[#C2F84F]">.ai</span>
        </h2>
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-8 border-t border-[#FAFDEE]/20 dark:border-slate-800 text-xs uppercase font-bold tracking-wider font-zodiak">
          <div className="flex flex-col gap-1">
            <span className="text-[#C2F84F] font-comico text-sm tracking-wide">Market Intelligence</span>
            <p className="text-[#FAFDEE]/70 dark:text-slate-400 font-normal normal-case">Real-time skill gap analysis & benchmark data</p>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[#C2F84F] font-comico text-sm tracking-wide">Career Trajectory</span>
            <p className="text-[#FAFDEE]/70 dark:text-slate-400 font-normal normal-case">Personalized AI learning paths & role mapping</p>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[#C2F84F] font-comico text-sm tracking-wide">99.4% Match Accuracy</span>
            <p className="text-[#FAFDEE]/70 dark:text-slate-400 font-normal normal-case">Deep learning resume parsing & role matching</p>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[#C2F84F] font-comico text-sm tracking-wide">Target Roles</span>
            <p className="text-[#FAFDEE]/70 dark:text-slate-400 font-normal normal-case">AI Architect, System Designer, ML Engineer</p>
          </div>
        </div>
      </div>
    </section>
  );
}

