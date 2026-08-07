'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { FileText, CheckCircle2, Award, Briefcase, Code, Sparkles } from 'lucide-react';

interface ResumeBackgroundProps {
  hasResume?: boolean;
  resumeName?: string | null;
  mode?: 'job' | 'dream';
}

export const ResumeBackground: React.FC<ResumeBackgroundProps> = ({
  hasResume = false,
  resumeName,
  mode = 'job',
}) => {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden select-none">
      {/* Base Canvas Color Layer */}
      <div className="absolute inset-0 bg-[#F5F4EE] dark:bg-[#060608] transition-colors duration-500" />

      {/* Grid Pattern */}
      <div 
        className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]" 
        style={{
          backgroundImage: `radial-gradient(#000 1px, transparent 1px)`,
          backgroundSize: '32px 32px'
        }}
      />
      <div 
        className="absolute inset-0 opacity-0 dark:opacity-[0.04]" 
        style={{
          backgroundImage: `radial-gradient(#fff 1px, transparent 1px)`,
          backgroundSize: '32px 32px'
        }}
      />

      {/* Ambient Soft Glow Orbs */}
      <motion.div
        animate={{
          scale: [1, 1.15, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full bg-gradient-to-br from-brand-teal/20 via-brand-mint/10 to-transparent blur-[120px]"
      />
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.25, 0.45, 0.25],
        }}
        transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
        className="absolute -bottom-32 -right-32 w-[600px] h-[600px] rounded-full bg-gradient-to-tl from-brand-pink/20 via-brand-lavender/10 to-transparent blur-[140px]"
      />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full bg-brand-ochre/5 blur-[160px]" />

      {/* Floating Watermarked Resume Sheets */}
      <div className="absolute inset-0 flex items-center justify-center">
        {/* Left Floating Resume Sheet (Primary Watermark) */}
        <motion.div
          initial={{ opacity: 0, y: 40, rotate: -6 }}
          animate={{
            opacity: hasResume ? 0.22 : 0.12,
            y: [0, -12, 0],
            rotate: -6,
            scale: hasResume ? 1.02 : 1,
          }}
          transition={{
            opacity: { duration: 0.6 },
            scale: { duration: 0.6 },
            y: { duration: 9, repeat: Infinity, ease: 'easeInOut' },
          }}
          className="hidden md:block absolute -left-12 lg:left-8 top-28 w-[420px] h-[580px] bg-white dark:bg-[#111116] rounded-2xl border border-black/10 dark:border-white/10 p-7 shadow-2xl backdrop-blur-sm"
        >
          {/* Resume Header Skeleton */}
          <div className="flex items-center justify-between pb-4 border-b border-black/10 dark:border-white/10 mb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-brand-teal/10 dark:bg-brand-teal/20 flex items-center justify-center text-brand-teal font-bold text-sm">
                <FileText size={18} />
              </div>
              <div>
                <div className="w-32 h-3.5 bg-black/20 dark:bg-white/20 rounded-full mb-1.5" />
                <div className="w-24 h-2 bg-black/10 dark:bg-white/10 rounded-full" />
              </div>
            </div>
            {hasResume && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-mono font-bold tracking-wider uppercase">
                <CheckCircle2 size={10} /> Ready
              </span>
            )}
          </div>

          {/* Resume Section: Work Experience */}
          <div className="space-y-4 mb-6">
            <div className="flex items-center gap-2">
              <Briefcase size={12} className="text-brand-pink" />
              <div className="w-28 h-2.5 bg-black/30 dark:bg-white/30 rounded-full" />
            </div>
            <div className="space-y-2 pl-4 border-l-2 border-brand-teal/20">
              <div className="w-full h-2 bg-black/15 dark:bg-white/15 rounded-full" />
              <div className="w-4/5 h-2 bg-black/10 dark:bg-white/10 rounded-full" />
              <div className="w-3/5 h-2 bg-black/10 dark:bg-white/10 rounded-full" />
            </div>
            <div className="space-y-2 pl-4 border-l-2 border-brand-pink/20">
              <div className="w-11/12 h-2 bg-black/15 dark:bg-white/15 rounded-full" />
              <div className="w-2/3 h-2 bg-black/10 dark:bg-white/10 rounded-full" />
            </div>
          </div>

          {/* Resume Section: Skills Matrix */}
          <div className="space-y-3 mb-6">
            <div className="flex items-center gap-2">
              <Code size={12} className="text-brand-teal" />
              <div className="w-24 h-2.5 bg-black/30 dark:bg-white/30 rounded-full" />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {['TypeScript', 'React.js', 'Node.js', 'Next.js', 'System Architecture', 'GraphQL', 'Tailwind', 'Docker'].map((skill, i) => (
                <span
                  key={i}
                  className="px-2 py-0.5 rounded bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 text-[9px] font-mono text-black/50 dark:text-white/50"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>

          {/* Resume Section: Key Achievements */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Award size={12} className="text-brand-ochre" />
              <div className="w-32 h-2.5 bg-black/30 dark:bg-white/30 rounded-full" />
            </div>
            <div className="w-full h-2 bg-black/10 dark:bg-white/10 rounded-full" />
            <div className="w-4/5 h-2 bg-black/10 dark:bg-white/10 rounded-full" />
          </div>
        </motion.div>

        {/* Right Floating Resume Sheet (Secondary Watermark / Vector Target) */}
        <motion.div
          initial={{ opacity: 0, y: -20, rotate: 5 }}
          animate={{
            opacity: mode === 'dream' ? 0.2 : 0.12,
            y: [0, 10, 0],
            rotate: 5,
          }}
          transition={{
            opacity: { duration: 0.6 },
            y: { duration: 11, repeat: Infinity, ease: 'easeInOut', delay: 1 },
          }}
          className="hidden lg:block absolute -right-10 lg:right-6 top-40 w-[400px] h-[540px] bg-white dark:bg-[#111116] rounded-2xl border border-black/10 dark:border-white/10 p-7 shadow-2xl backdrop-blur-sm"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-black/10 dark:border-white/10 mb-5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-brand-pink/10 dark:bg-brand-pink/20 flex items-center justify-center text-brand-pink">
                <Sparkles size={16} />
              </div>
              <div>
                <div className="w-36 h-3 bg-black/20 dark:bg-white/20 rounded-full mb-1" />
                <div className="w-20 h-2 bg-black/10 dark:bg-white/10 rounded-full" />
              </div>
            </div>
            <span className="px-2 py-0.5 rounded bg-brand-pink/10 text-brand-pink text-[9px] font-mono uppercase font-bold tracking-wider">
              {mode === 'dream' ? 'Target Dream' : 'Target JD'}
            </span>
          </div>

          {/* Requirement Delta Lines */}
          <div className="space-y-4">
            <div className="p-3 rounded-xl bg-black/5 dark:bg-white/5 space-y-2">
              <div className="w-3/4 h-2.5 bg-black/25 dark:bg-white/25 rounded-full" />
              <div className="w-full h-2 bg-black/10 dark:bg-white/10 rounded-full" />
              <div className="w-5/6 h-2 bg-black/10 dark:bg-white/10 rounded-full" />
            </div>

            <div className="p-3 rounded-xl bg-black/5 dark:bg-white/5 space-y-2">
              <div className="w-2/3 h-2.5 bg-black/25 dark:bg-white/25 rounded-full" />
              <div className="w-full h-2 bg-black/10 dark:bg-white/10 rounded-full" />
              <div className="w-4/5 h-2 bg-black/10 dark:bg-white/10 rounded-full" />
            </div>

            <div className="pt-2 flex gap-2">
              <div className="h-6 w-20 rounded bg-brand-teal/10 border border-brand-teal/20" />
              <div className="h-6 w-24 rounded bg-brand-pink/10 border border-brand-pink/20" />
              <div className="h-6 w-16 rounded bg-brand-ochre/10 border border-brand-ochre/20" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Radial Vignette Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#F5F4EE]/40 to-[#F5F4EE]/90 dark:via-[#060608]/40 dark:to-[#060608]/90" />
    </div>
  );
};
