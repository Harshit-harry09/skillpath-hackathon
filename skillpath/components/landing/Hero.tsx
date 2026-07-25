'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { NeuralSocialProof } from './NeuralSocialProof';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring, useScroll } from 'framer-motion';
import { ArrowRight, FileText, Sparkles, Lightbulb, X, Compass, Cpu, Zap, ShieldCheck } from 'lucide-react';
import { useUI } from '@/context/UIContext';
import { Button } from '@/components/ui/Button';

export function Hero() {
  const { loaded } = useUI();
  const { user, openAuthModal } = useAuth();
  const router = useRouter();
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springX = useSpring(mouseX, { stiffness: 60, damping: 20 });
  const springY = useSpring(mouseY, { stiffness: 60, damping: 20 });
  
  // Subtle parallax for the SVG column
  const svgX = useTransform(springX, [-1, 1], [-12, 12]);
  const svgY = useTransform(springY, [-1, 1], [-8, 8]);

  const handleMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    mouseX.set(((e.clientX - rect.left) / rect.width - 0.5) * 2);
    mouseY.set(((e.clientY - rect.top) / rect.height - 0.5) * 2);
  };

  const { scrollY } = useScroll();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const path = "M 150 450 Q 300 450, 400 300 T 650 150";

  // Stagger container — children inherit delay via index
  const stagger: any = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
  };
  const fadeUp: any = {
    hidden: { opacity: 0, y: 24 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] as any } },
  };

  return (
    <section
      onMouseMove={handleMouseMove}
      className="relative bg-transparent text-ink py-16 md:py-24 px-6 lg:px-20 w-full flex justify-center min-h-[92vh] items-center overflow-hidden dot-grid"
    >
      {/* Background vignette & gradient glow */}
      <div className="absolute inset-0 z-[1] bg-gradient-to-b from-canvas via-transparent to-canvas pointer-events-none" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-brand-teal/10 dark:bg-brand-teal/20 rounded-full blur-[140px] pointer-events-none" />

      {/* ── Main grid ────────────────────────────────────────────────── */}
      <div className="max-w-[1280px] w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">

        {/* Left column */}
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="visible"
          className="lg:col-span-5 flex flex-col items-start text-left gap-7"
        >
          {/* Eyebrow / Technical Badge */}
          <motion.div variants={fadeUp}>
            <span className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full border border-teal-500/30 bg-teal-500/10 dark:bg-teal-500/15 backdrop-blur-md text-[11px] font-mono font-bold uppercase tracking-widest text-teal-600 dark:text-teal-300 shadow-[0_0_15px_rgba(45,212,191,0.15)]">
              <span className="w-2 h-2 rounded-full bg-brand-teal animate-ping" />
              ⚡ NEURAL CAREER INTELLIGENCE
            </span>
          </motion.div>

          {/* Headline */}
          <motion.div variants={fadeUp} style={{ willChange: 'transform, opacity' }}>
            <h1 className="font-display text-display-md lg:text-[68px] font-extrabold leading-[1.04] tracking-tighter text-ink">
              Go to market<br />
              <span className="bg-gradient-to-r from-brand-teal via-teal-400 to-brand-pink bg-clip-text text-transparent">
                with precision.
              </span>
            </h1>
          </motion.div>

          {/* Body */}
          <motion.p
            variants={fadeUp}
            className="font-sans text-body-md lg:text-[18px] text-ink/75 max-w-md font-medium leading-relaxed"
            style={{ willChange: 'transform, opacity' }}
          >
            Analyze your current resume, uncover critical skill gaps, and map your AI-powered career trajectory with deep learning market benchmarks.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div variants={fadeUp} className="flex flex-wrap items-center gap-4 pt-1" style={{ willChange: 'transform, opacity' }}>
            <button
              onClick={() => user ? router.push('/analyze') : openAuthModal()}
              className="group relative flex items-center gap-3 px-8 py-4 bg-ink dark:bg-teal-400 text-on-primary dark:text-slate-950 rounded-full transition-all duration-300 hover:shadow-[0_0_30px_rgba(45,212,191,0.35)] active:scale-95 overflow-hidden font-semibold text-[16px]"
            >
              {/* Shimmer on hover */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              <span className="relative z-10 font-bold">Analyze Resume</span>
              <motion.div
                className="relative z-10"
                animate={{ x: [0, 4, 0] }}
                transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut', repeatDelay: 1 }}
              >
                <ArrowRight className="w-5 h-5" />
              </motion.div>
            </button>

            <button
              onClick={() => {
                const el = document.getElementById('explore');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
                else router.push('/explore');
              }}
              className="flex items-center gap-2 px-6 py-4 rounded-full border border-hairline hover:border-brand-teal/50 bg-surface-card/60 backdrop-blur-md text-ink font-semibold text-[15px] hover:bg-surface-soft transition-all duration-300 active:scale-95"
            >
              <Compass className="w-4 h-4 text-brand-teal" />
              <span>Explore Nodes</span>
            </button>
          </motion.div>

          {/* Social proof */}
          <motion.div variants={fadeUp}>
            <NeuralSocialProof />
          </motion.div>
        </motion.div>

        {/* Right column: Interactive Neural Career Canvas */}
        <motion.div
          style={{ x: svgX, y: svgY }}
          className="lg:col-span-7 relative h-[320px] md:h-[520px] lg:h-[620px] flex items-center justify-center overflow-visible"
          initial="hidden"
          animate={loaded ? "visible" : "hidden"}
        >
          {/* Luminous Outer Glass HUD Container */}
          <div className="absolute inset-0 rounded-[36px] bg-surface-card/40 dark:bg-slate-900/30 border border-white/10 dark:border-white/5 backdrop-blur-md shadow-[0_20px_60px_rgba(0,0,0,0.12)] pointer-events-none border-t border-t-white/20" />

          {/* Radial Ambient Glow */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={loaded ? {
              opacity: [0.2, 0.4, 0.2],
              scale: [1, 1.12, 1]
            } : {}}
            transition={{
              opacity: { duration: 4, repeat: Infinity, ease: "easeInOut" },
              scale: { duration: 4, repeat: Infinity, ease: "easeInOut" },
              delay: 1
            }}
            className="absolute pointer-events-none w-[320px] h-[320px] md:w-[550px] md:h-[550px] rounded-full"
            style={{
              background: 'radial-gradient(circle, var(--color-bulb-glow) 0%, transparent 70%)',
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)',
              willChange: 'transform, opacity'
            }}
          />

          <svg viewBox="0 0 800 600" className="w-full h-full max-w-[420px] md:max-w-none relative z-10" style={{ overflow: 'visible' }}>
            <defs>
              {/* Path gradient */}
              <linearGradient id="ribbonGradient" x1="0%" y1="100%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#FF4D8B" stopOpacity="0.8" />
                <stop offset="50%" stopColor="#6366F1" stopOpacity="0.6" />
                <stop offset="100%" stopColor="#2DD4BF" stopOpacity="0.9" />
              </linearGradient>

              {/* Glow filter for path */}
              <filter id="pathGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="8" result="blur" />
                <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>

              {/* Sphere gradients */}
              <radialGradient id="pinkSphere" cx="38%" cy="35%" r="55%">
                <stop offset="0%" stopColor="#FFE4ED" />
                <stop offset="60%" stopColor="#FF4D8B" />
                <stop offset="100%" stopColor="#CC2266" />
              </radialGradient>
              <radialGradient id="tealSphere" cx="38%" cy="35%" r="55%">
                <stop offset="0%" stopColor="#E6FFFA" />
                <stop offset="60%" stopColor="#2DD4BF" />
                <stop offset="100%" stopColor="#0D9488" />
              </radialGradient>
              <radialGradient id="yellowSphere" cx="38%" cy="35%" r="55%">
                <stop offset="0%" stopColor="#FFFBF0" />
                <stop offset="60%" stopColor="#E8B94A" />
                <stop offset="100%" stopColor="#C49030" />
              </radialGradient>

              {/* Soft shadow for spheres */}
              <filter id="sphereShadow" x="-40%" y="-40%" width="180%" height="180%">
                <feDropShadow dx="0" dy="8" stdDeviation="12" floodOpacity="0.22" />
              </filter>
            </defs>

            {/* ── Track / shadow path ── */}
            <motion.path
              d="M 152 453 Q 302 453, 402 303 T 652 153"
              fill="none"
              stroke="rgba(0,0,0,0.18)"
              strokeWidth="56"
              strokeLinecap="round"
              variants={{
                hidden: { pathLength: 0, opacity: 0 },
                visible: { pathLength: 1, opacity: 1 }
              }}
              transition={{ duration: 2.4, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
            />

            {/* ── Main ribbon path ── */}
            <motion.path
              d={path}
              fill="none"
              stroke="url(#ribbonGradient)"
              strokeWidth="48"
              strokeLinecap="round"
              filter="url(#pathGlow)"
              variants={{
                hidden: { pathLength: 0, opacity: 0 },
                visible: { pathLength: 1, opacity: 1 }
              }}
              transition={{ duration: 2.2, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
              style={{ willChange: 'pathLength, opacity' }}
            />

            {/* ── Gloss highlight on path ── */}
            <motion.path
              d={path}
              fill="none"
              stroke="white"
              strokeWidth="16"
              strokeLinecap="round"
              variants={{
                hidden: { pathLength: 0, opacity: 0 },
                visible: { pathLength: 0.6, opacity: 0.6 }
              }}
              transition={{ duration: 2.2, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
              style={{ willChange: 'pathLength, opacity' }}
            />

            {/* ── Node: Start (Current State) ── */}
            <motion.g
              variants={{
                hidden: { opacity: 0, scale: 0.5 },
                visible: { opacity: 1, scale: 1 }
              }}
              transition={{ delay: 1.0, type: 'spring', stiffness: 120, damping: 14 }}
              style={{ transformOrigin: '150px 450px', willChange: 'transform, opacity' }}
            >
              <motion.circle
                cx="150" cy="450" r="62"
                fill="none"
                stroke="#FF4D8B"
                strokeWidth="1.5"
                strokeOpacity="0.4"
                animate={{ r: [58, 68, 58], strokeOpacity: [0.4, 0.1, 0.4] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              />
              <circle cx="150" cy="450" r="44" fill="url(#pinkSphere)" filter="url(#sphereShadow)" />
              <ellipse cx="138" cy="436" rx="10" ry="6" fill="white" fillOpacity="0.4" />
              <FileText className="text-white" x="135" y="435" width="30" height="30" />
            </motion.g>

            {/* ── Node: Middle (Skill Accelerator Pipeline) ── */}
            <motion.g
              variants={{
                hidden: { opacity: 0, scale: 0.5 },
                visible: { opacity: 1, scale: 1 }
              }}
              transition={{ delay: 1.3, type: 'spring', stiffness: 120, damping: 14 }}
              style={{ transformOrigin: '400px 300px', willChange: 'transform, opacity' }}
            >
              <motion.circle
                cx="400" cy="300" r="62"
                fill="none"
                stroke="#2DD4BF"
                strokeWidth="1.5"
                strokeOpacity="0.4"
                animate={{ r: [58, 68, 58], strokeOpacity: [0.4, 0.1, 0.4] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
              />
              <circle cx="400" cy="300" r="44" fill="url(#tealSphere)" filter="url(#sphereShadow)" />
              <ellipse cx="388" cy="286" rx="10" ry="6" fill="white" fillOpacity="0.4" />
              <Sparkles className="text-slate-950" x="385" y="285" width="30" height="30" />
            </motion.g>

            {/* ── Node: End (Target Career Goal) ── */}
            <motion.g
              variants={{
                hidden: { opacity: 0, scale: 0.5 },
                visible: { opacity: 1, scale: 1 }
              }}
              transition={{ delay: 1.6, type: 'spring', stiffness: 120, damping: 12 }}
              style={{ transformOrigin: '650px 150px', willChange: 'transform, opacity' }}
            >
              <motion.circle
                cx="650" cy="150" r="100"
                fill="var(--color-bulb-glow)"
                animate={{ r: [90, 120, 90], opacity: [0.4, 0.15, 0.4] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                style={{ filter: 'blur(28px)' }}
              />
              <circle cx="650" cy="150" r="44" fill="url(#yellowSphere)" filter="url(#sphereShadow)" />
              <ellipse cx="638" cy="136" rx="11" ry="6.5" fill="white" fillOpacity="0.45" />
              <Lightbulb className="text-slate-900" x="635" y="135" width="30" height="30" />
            </motion.g>
          </svg>

          {/* Clean Floating Node Labels */}
          <div className="absolute inset-0 pointer-events-none z-20">
            {/* Node 1: Current Resume */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2, duration: 0.6 }}
              style={{ bottom: '10%', left: '8%' }}
              className="absolute px-3 py-1.5 rounded-full bg-surface-card/95 border border-hairline backdrop-blur-md shadow-lg text-[11px] font-mono font-bold uppercase tracking-wider text-ink flex items-center gap-2"
            >
              <span className="w-2 h-2 rounded-full bg-brand-pink" />
              Current Resume
            </motion.div>

            {/* Node 2: AI Learning Pipeline */}
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.5, duration: 0.6 }}
              style={{ top: '38%', left: '42%' }}
              className="absolute px-3.5 py-1.5 rounded-full bg-surface-card/95 border border-hairline backdrop-blur-md shadow-lg text-[11px] font-mono font-bold uppercase tracking-wider text-ink flex items-center gap-2"
            >
              <span className="w-2 h-2 rounded-full bg-brand-teal animate-pulse" />
              AI Learning Pipeline
            </motion.div>

            {/* Node 3: Target Outcome */}
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.8, duration: 0.6 }}
              style={{ top: '10%', right: '8%' }}
              className="absolute px-3.5 py-1.5 rounded-full bg-surface-card/95 border border-hairline backdrop-blur-md shadow-lg text-[11px] font-mono font-bold uppercase tracking-wider text-ink flex items-center gap-2"
            >
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              Senior AI Architect
            </motion.div>
          </div>
        </motion.div>
      </div>

      {/* ── Analysis overlay ────────────────────────────────────────── */}
      <AnimatePresence>
        {isAnalyzing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center p-4"
            style={{ backdropFilter: 'blur(24px)', background: 'rgba(var(--canvas-rgb, 11, 19, 38) / 0.85)' }}
          >
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(0,0,0,0.2)_100%)] pointer-events-none" />

            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 16 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] as any }}
              className="relative w-full max-w-md mx-auto bg-surface-card rounded-3xl border border-hairline text-center overflow-hidden shadow-2xl"
            >
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-teal-400/80 to-transparent" />

              <div className="p-8 sm:p-10">
                <button
                  onClick={() => setIsAnalyzing(false)}
                  className="absolute top-5 right-5 p-2 hover:bg-surface-soft rounded-full transition-colors text-muted hover:text-ink"
                >
                  <X className="w-4 h-4" />
                </button>

                <div className="relative mx-auto w-16 h-16 mb-6">
                  <div className="absolute inset-0 rounded-full shadow-inner" />
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                    className="w-full h-full rounded-full border-[3px] border-surface-soft border-t-brand-teal"
                  />
                  <motion.div
                    animate={{ rotate: -360 }}
                    transition={{ duration: 5, repeat: Infinity, ease: 'linear' }}
                    className="absolute inset-1.5 rounded-full border-[2px] border-transparent border-t-brand-pink/50"
                  />
                </div>

                <h2 className="font-display text-[26px] font-extrabold tracking-tight mb-2 text-ink">
                  Analyze Your Journey
                </h2>
                <p className="font-sans text-body-sm text-muted mb-6 leading-relaxed max-w-xs mx-auto">
                  Upload your resume to trigger synthetic market matching & gap detection.
                </p>

                <label className="cursor-pointer group block w-full p-6 border border-dashed border-teal-500/30 rounded-2xl hover:border-brand-teal hover:bg-teal-500/5 transition-all duration-300">
                  <input
                    type="file"
                    className="hidden"
                    onChange={(e) => { if (e.target.files?.[0]) router.push('/analyze'); }}
                  />
                  <motion.div
                    animate={{ y: [0, -4, 0] }}
                    transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    <FileText className="w-10 h-10 text-brand-teal mx-auto mb-3" />
                  </motion.div>
                  <span className="font-sans text-sm font-bold text-ink block">
                    Drop resume here or click to browse
                  </span>
                  <span className="font-mono text-xs text-muted mt-1 block">PDF or DOCX</span>
                </label>

                <button
                  onClick={() => setIsAnalyzing(false)}
                  className="mt-6 font-mono text-xs font-bold text-muted hover:text-ink transition-colors uppercase tracking-[0.15em]"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

