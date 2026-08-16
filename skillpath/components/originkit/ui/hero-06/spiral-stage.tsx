// Delivered by Originkit · stack: nextjs · styling: tailwind
"use client";

import { motion, useReducedMotion } from "motion/react";
import SpiralImages from "@/components/originkit/ui/hero-06/spiral-image";
import { HeroContent } from "@/components/originkit/ui/hero-06/hero-content";

/** Public asset URLs — use a function so preview rewriters stay stable. */
function asset(file: string) {
  return `/originkit/hero-06/${file}`;
}

/** ease-out-cubic */
const EASE_OUT = [0.215, 0.61, 0.355, 1] as const;

type SpiralStageProps = {
  onExplorePeople: () => void;
  onViewStories: () => void;
};

export const SpiralStage = ({
  onExplorePeople,
  onViewStories,
}: SpiralStageProps) => {
  const reduceMotion = useReducedMotion();

  return (
    <div className="relative min-h-[92vh] sm:min-h-screen w-full flex flex-col items-center justify-center pt-8 pb-16 px-4">
      {/* 1. Spiral images vortex canvas in background */}
      <motion.div
        className="pointer-events-none absolute inset-0 z-10"
        initial={reduceMotion ? { opacity: 1 } : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={
          reduceMotion
            ? { duration: 0 }
            : { type: "tween", duration: 0.6, ease: EASE_OUT, delay: 0.1 }
        }
      >
        <SpiralImages />
      </motion.div>

      {/* 2. Center Glowing Aperture Lens / Radar */}
      <motion.div
        className="pointer-events-none relative z-20 mb-4 flex flex-col items-center justify-center"
        initial={reduceMotion ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={
          reduceMotion
            ? { duration: 0 }
            : { type: "tween", duration: 0.6, ease: EASE_OUT, delay: 0.2 }
        }
      >
        <div className="relative w-[110px] h-[110px] sm:w-[130px] sm:h-[130px] md:w-[150px] md:h-[150px] flex items-center justify-center">
          {/* Radiant Glow */}
          <div className="absolute inset-[-30%] pointer-events-none z-0 opacity-75 dark:opacity-90">
            <img
              src={asset("lens-lens-glow.svg")}
              alt=""
              className="w-full h-full object-contain"
              draggable={false}
            />
          </div>
          {/* Glass Camera Lens */}
          <img
            src={asset("lens-camera-lens.png")}
            alt="SkillPath Intelligence Lens"
            width={150}
            height={150}
            className="relative z-10 w-full h-full object-contain drop-shadow-[0_8px_20px_rgba(0,0,0,0.35)]"
            draggable={false}
          />
        </div>
      </motion.div>

      {/* 3. Hero Content Copy & CTAs */}
      <div className="relative z-30 flex flex-col items-center w-full max-w-4xl">
        <HeroContent
          onExplorePeople={onExplorePeople}
          onViewStories={onViewStories}
        />
      </div>
    </div>
  );
};
