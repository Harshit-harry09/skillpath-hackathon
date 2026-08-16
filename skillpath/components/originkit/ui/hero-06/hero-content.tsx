// Delivered by Originkit · stack: nextjs · styling: tailwind
"use client";

import { motion, useReducedMotion } from "motion/react";
import { Zap, ArrowRight, Target } from "lucide-react";

/** ease-out-cubic */
const EASE_OUT = [0.215, 0.61, 0.355, 1] as const;

type HeroContentProps = {
  onExplorePeople: () => void;
  onViewStories: () => void;
};

/**
 * Hero copy + CTAs — SkillPath Optimized with Originkit Hero-06 Motion
 */
export const HeroContent = ({
  onExplorePeople,
  onViewStories,
}: HeroContentProps) => {
  const reduceMotion = useReducedMotion();

  const reveal = (delay: number) =>
    reduceMotion
      ? { initial: { opacity: 1 }, animate: { opacity: 1 } }
      : {
          initial: { opacity: 0, y: 16 },
          animate: { opacity: 1, y: 0 },
          transition: {
            type: "tween" as const,
            duration: 0.45,
            ease: EASE_OUT,
            delay,
          },
        };

  return (
    <div className="relative z-30 flex w-full max-w-[700px] flex-col items-center gap-4 sm:gap-5 px-4 text-center">
      {/* Top Badge */}
      <motion.div {...reveal(0.2)}>
        <span className="inline-flex items-center gap-2 px-4 py-1.5 text-[11px] font-black uppercase tracking-widest bg-white/90 dark:bg-slate-900/90 backdrop-blur-md text-brand-pink border border-black/10 dark:border-brand-pink/30 rounded-full shadow-sm">
          <Zap className="w-3.5 h-3.5 fill-current text-brand-pink" />
          Inclusive Workforce Orchestrator • 14 Autonomous Agents
        </span>
      </motion.div>

      {/* Main Headline */}
      <motion.h1
        {...reveal(0.28)}
        className="w-full font-helvetica-neue text-[32px] sm:text-[46px] md:text-[54px] font-black leading-[1.08] tracking-[-1.5px] text-balance text-slate-900 dark:text-white"
      >
        <span className="text-slate-500 dark:text-slate-400">Master the Skills Behind </span>
        <span className="text-slate-900 dark:text-white">Every Breakthrough.</span>
      </motion.h1>

      {/* Subhead */}
      <motion.p
        {...reveal(0.36)}
        className="w-full max-w-[560px] font-sans text-[14px] sm:text-[16px] leading-relaxed tracking-[-0.2px] text-slate-600 dark:text-slate-300 text-pretty font-medium"
      >
        Closing the <span className="font-bold text-slate-900 dark:text-white">$5.5T global skills gap</span> with real-time gap discovery, 0% career gap penalties, stepped bridge pathways, and verified competency benchmarks.
      </motion.p>

      {/* CTAs */}
      <motion.div
        {...reveal(0.48)}
        className="flex flex-row flex-wrap items-center justify-center gap-3.5 pt-2"
      >
        <button
          type="button"
          onClick={onExplorePeople}
          className="group inline-flex items-center gap-2.5 px-6 py-3.5 rounded-full font-sans text-[14px] sm:text-[15px] font-bold text-white bg-slate-900 dark:bg-brand-pink dark:text-white hover:bg-slate-800 dark:hover:bg-brand-pink/90 shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-150 active:scale-[0.98] cursor-pointer"
        >
          <Zap className="w-4 h-4 fill-current text-brand-pink dark:text-white" />
          <span>Launch Atlas Swarm</span>
          <ArrowRight className="w-4 h-4 transition-transform duration-150 group-hover:translate-x-1" />
        </button>

        <button
          type="button"
          onClick={onViewStories}
          className="inline-flex items-center gap-2 px-5 py-3.5 rounded-full font-sans text-[14px] sm:text-[15px] font-bold text-slate-900 dark:text-white bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 hover:-translate-y-0.5 transition-all duration-150 active:scale-[0.98] cursor-pointer shadow-sm"
        >
          <Target className="w-4 h-4 text-brand-pink" />
          <span>Analyze Resume</span>
        </button>
      </motion.div>

      {/* Trust Badges Bar */}
      <motion.div
        {...reveal(0.55)}
        className="flex items-center justify-center gap-4 sm:gap-8 pt-4 w-full max-w-lg border-t border-black/10 dark:border-slate-800 mt-2"
      >
        {[
          { val: "$5.5T", label: "Skills Gap" },
          { val: "0%", label: "Gap Penalty" },
          { val: "A+", label: "Fairness Grade" },
          { val: "SAP TIH", label: "Standard Schema" },
        ].map((s, i) => (
          <div key={i} className="flex flex-col items-center">
            <span className="font-black text-sm sm:text-base leading-none text-slate-900 dark:text-white tracking-tight">
              {s.val}
            </span>
            <span className="text-[8px] sm:text-[9px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mt-1 text-center">
              {s.label}
            </span>
          </div>
        ))}
      </motion.div>
    </div>
  );
};
