'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Sparkles, ArrowRight, FileText, Cpu, Search } from 'lucide-react';

import { useTheme } from 'next-themes';
import NeuralBackground from '@/components/ui/flow-field-background';

export function LandingInputSection() {
  const [jd, setJd] = useState('');
  const router = useRouter();
  const { user, openAuthModal } = useAuth();
  const [mounted, setMounted] = useState(false);
  const { theme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted && theme === 'dark';
  const particleColor = isDark ? '#2dd4bf' : '#ff4d8b';
  const trailColor = isDark ? '11, 19, 38' : '255, 250, 240';

  const sampleRoles = [
    'Full-Stack AI Engineer',
    'LLM Systems Architect',
    'Senior ML Infrastructure',
    'Principal Product Engineer'
  ];

  const handleStart = () => {
    if (!user) {
      openAuthModal();
      return;
    }

    if (jd.trim()) {
      sessionStorage.setItem('pending_jd', jd);
      router.push('/analyze');
    }
  };

  return (
    <section id="analyze" className="relative bg-canvas py-20 px-6 lg:px-20 flex justify-center border-t border-hairline overflow-hidden">
      {/* Background Shader */}
      <div className="absolute inset-0 z-0 opacity-25 pointer-events-none">
        <NeuralBackground
          color={particleColor}
          trailColor={trailColor}
          trailOpacity={0.1}
          particleCount={1200}
          speed={0.4}
        />
      </div>

      <motion.div
        initial={{ opacity: 1, y: 0 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-[1280px] w-full grid grid-cols-1 lg:grid-cols-12 gap-10 items-center relative z-10"
      >
        <div className="lg:col-span-5 space-y-5">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/30 text-[11px] font-mono font-bold uppercase tracking-widest text-teal-400">
            <Cpu className="w-3.5 h-3.5 animate-pulse text-brand-teal" />
            SYNTHETIC GAP ENGINE
          </div>

          <h2 className="font-display text-4xl sm:text-5xl font-extrabold text-ink tracking-tight leading-[1.08]">
            Bridge your skill gap <br />
            <span className="bg-gradient-to-r from-brand-teal to-brand-pink bg-clip-text text-transparent">
              in real time.
            </span>
          </h2>

          <p className="font-sans text-lg text-muted leading-relaxed max-w-md font-medium">
            Paste any target Job Description. Our deep learning engine extracts missing competencies and constructs your step-by-step career path.
          </p>

          {/* Quick select sample role tags */}
          <div className="space-y-2 pt-2">
            <span className="text-[11px] font-mono font-bold text-muted uppercase tracking-wider block">
              Quick Select Target Role:
            </span>
            <div className="flex flex-wrap gap-2">
              {sampleRoles.map((role) => (
                <button
                  key={role}
                  onClick={() => setJd(`Targeting role: ${role}. Requires core engineering, architecture, and deployment standards.`)}
                  className="px-3 py-1.5 rounded-full text-xs font-mono bg-surface-soft/80 hover:bg-teal-500/15 border border-hairline hover:border-teal-500/40 text-ink/80 hover:text-brand-teal transition-all duration-200"
                >
                  + {role}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Input HUD Glass Panel */}
        <div className="lg:col-span-7">
          <div className="bg-surface-card/80 dark:bg-slate-900/60 border border-white/10 dark:border-white/5 rounded-3xl p-6 md:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.15)] backdrop-blur-xl relative overflow-hidden border-t border-t-white/20">
            
            {/* Top Bar Indicator */}
            <div className="flex items-center justify-between border-b border-hairline/60 pb-4 mb-4">
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-brand-teal" />
                <span className="text-xs font-mono font-bold text-ink uppercase tracking-wider">
                  Target Job Description Evaluator
                </span>
              </div>
              <span className="text-[10px] font-mono font-bold text-teal-400 bg-teal-500/10 px-2.5 py-1 rounded-full border border-teal-500/20">
                AI Parser Ready
              </span>
            </div>

            <div className="bg-canvas/80 rounded-2xl overflow-hidden flex flex-col min-h-[280px] border border-hairline focus-within:border-brand-teal/50 focus-within:ring-1 focus-within:ring-brand-teal/20 transition-all">
              <textarea
                placeholder="Paste target Job Description, requirements, or role expectations here..."
                className="flex-1 p-5 font-sans text-body-md text-ink placeholder:text-muted/60 bg-transparent focus:outline-none resize-none leading-relaxed"
                value={jd}
                onChange={(e) => setJd(e.target.value)}
              />
              <div className="p-4 border-t border-hairline flex flex-wrap items-center justify-between gap-4 bg-surface-soft/40">
                <div className="flex items-center gap-2 text-xs text-muted font-mono">
                  <Sparkles className="w-3.5 h-3.5 text-brand-pink" />
                  <span>Instant skill match & gap analysis</span>
                </div>

                <button
                  onClick={handleStart}
                  disabled={!jd.trim()}
                  className="bg-brand-teal text-slate-950 font-bold font-sans text-sm px-6 py-3 rounded-xl hover:shadow-[0_0_20px_rgba(45,212,191,0.4)] transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed uppercase tracking-wider flex items-center gap-2"
                >
                  <span>Generate Roadmap</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}

