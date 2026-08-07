'use client';
// updated

import React, { useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { motion, useScroll } from 'framer-motion';
import { ArrowRight, Zap, Target, BarChart3, Brain, TrendingUp } from 'lucide-react';
import { LinePath } from './LinePath';

export function Hero() {
  const ref = useRef<HTMLDivElement>(null);
  const { user, openAuthModal } = useAuth();
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
      style={{ transform: 'translateZ(0)', contain: 'content' }}
      className="mx-auto relative flex min-h-[140vh] w-full flex-col items-center justify-between overflow-hidden bg-[#FAFDEE] dark:bg-[#060608] px-4 pt-12 md:pt-20 text-[#1F3A4B] dark:text-[#FAFDEE] selection:bg-[#C2F84F] selection:text-[#1F3A4B] transition-colors duration-300"
    >
      {/* Background SVG Scroll Stroke - Right */}
      <LinePath
        className="absolute -right-[25%] top-0 z-0 pointer-events-none opacity-40 md:opacity-75 max-w-[1200px] text-[#1F3A4B] dark:text-[#C2F84F]"
        scrollYProgress={scrollYProgress}
      />

      {/* Background SVG Scroll Stroke - Left (Mirrored) */}
      <LinePath
        className="absolute -left-[25%] top-0 z-0 pointer-events-none opacity-40 md:opacity-75 max-w-[1200px] text-[#1F3A4B] dark:text-[#C2F84F]"
        scrollYProgress={scrollYProgress}
        mirrored={true}
      />

      {/* Main Hero Header Block */}
      <div className="relative z-10 flex w-full max-w-5xl flex-col items-center justify-center gap-6 text-center pt-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <span className="inline-flex items-center gap-2 px-4 py-2 text-[11px] font-black uppercase tracking-widest bg-[#1F3A4B] dark:bg-slate-900 text-[#C2F84F] border-2 border-[#1F3A4B] dark:border-[#C2F84F] rounded-lg shadow-[3px_3px_0_#C2F84F] dark:shadow-[3px_3px_0_#ff4d8b]">
            <Zap className="w-3.5 h-3.5 fill-current" />
            Neural Career Intelligence
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="relative z-10 text-5xl sm:text-7xl lg:text-8xl font-black tracking-[-0.06em] leading-[0.95] text-[#1F3A4B] dark:text-white"
        >
          The Stroke That <br />
          Follows Your <br />
          <span className="text-[#ff4d8b] relative inline-block">
            Career Progress
            <span className="absolute left-0 bottom-1 w-full h-[6px] bg-[#C2F84F] -z-10 rounded-full" />
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="relative z-10 max-w-2xl text-lg sm:text-xl font-semibold text-[#1F3A4B]/80 dark:text-slate-300 leading-relaxed"
        >
          Analyze your resume, uncover critical skill gaps, and map your AI-powered career trajectory with real-time market benchmarks.
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
            className="group flex items-center gap-3 font-black uppercase tracking-wider text-sm px-8 py-4 rounded-xl bg-[#1F3A4B] text-[#FAFDEE] dark:bg-[#C2F84F] dark:text-[#1F3A4B] border-2 border-[#1F3A4B] dark:border-[#C2F84F] shadow-[5px_5px_0_#ff4d8b] hover:shadow-[7px_7px_0_#ff4d8b] transition-all duration-150 active:translate-y-[2px] active:shadow-none"
          >
            <Zap className="w-4 h-4 fill-current text-[#C2F84F] dark:text-[#1F3A4B]" />
            Analyze Resume
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </button>

          <button
            onClick={() => {
              const el = document.getElementById('explore');
              el ? el.scrollIntoView({ behavior: 'smooth' }) : router.push('/explore');
            }}
            className="flex items-center gap-2 font-black uppercase tracking-wider text-sm px-6 py-4 rounded-xl bg-transparent text-[#1F3A4B] dark:text-white border-2 border-[#1F3A4B] dark:border-slate-700 shadow-[4px_4px_0_#1F3A4B] dark:shadow-[4px_4px_0_#C2F84F] hover:bg-[#1F3A4B]/5 dark:hover:bg-white/10 transition-all duration-150 active:translate-y-[2px] active:shadow-none"
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
                <span className="font-black text-xl sm:text-2xl leading-none text-[#1F3A4B] dark:text-white tracking-tight">{s.val}</span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#1F3A4B]/70 dark:text-slate-400 mt-1">{s.label}</span>
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
                <span className="font-black text-2xl sm:text-3xl tracking-tight">{m.value}</span>
              </div>
            ))}
          </div>

          {/* Skill Bars */}
          <div className="pt-6 space-y-3.5">
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-widest text-[#FAFDEE]/70 dark:text-slate-400">
              <span>Skill Gap Breakdown</span>
              <span className="text-[#ff4d8b]">Priority missing</span>
            </div>
            {skills.map((s, i) => (
              <div key={i} className="space-y-1.5">
                <div className="flex justify-between items-center text-xs font-bold">
                  <span>{s.label}</span>
                  <span style={{ color: s.color }}>{s.score}%</span>
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
      <div className="relative z-10 w-full rounded-3xl bg-[#1F3A4B] dark:bg-[#111116] text-[#FAFDEE] p-8 sm:p-12 mb-8 border-4 border-[#1F3A4B] dark:border-slate-800 shadow-2xl">
        <h2 className="text-center text-[12vw] sm:text-[14vw] font-black leading-[0.85] tracking-tighter text-[#FAFDEE]">
          skillpath.ai
        </h2>
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-8 border-t border-[#FAFDEE]/20 dark:border-slate-800 text-xs uppercase font-bold tracking-wider">
          <div className="flex flex-col gap-1">
            <span className="text-[#C2F84F]">Market Intelligence</span>
            <p className="text-[#FAFDEE]/70 dark:text-slate-400 font-normal">Real-time skill gap analysis & benchmark data</p>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[#C2F84F]">Career Trajectory</span>
            <p className="text-[#FAFDEE]/70 dark:text-slate-400 font-normal">Personalized AI learning paths & role mapping</p>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[#C2F84F]">99.4% Match Accuracy</span>
            <p className="text-[#FAFDEE]/70 dark:text-slate-400 font-normal">Deep learning resume parsing & role matching</p>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[#C2F84F]">Target Roles</span>
            <p className="text-[#FAFDEE]/70 dark:text-slate-400 font-normal">AI Architect, System Designer, ML Engineer</p>
          </div>
        </div>
      </div>
    </section>
  );
}

