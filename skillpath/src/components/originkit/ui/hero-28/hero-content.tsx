// Delivered by Originkit · stack: nextjs · styling: tailwind
"use client";

"use client";

import { motion, useReducedMotion } from "motion/react";

import { Button } from "@/components/originkit/ui/hero-28/button";

/**
 * Headline, sub and CTA pair — Figma mobile 2356:491, iPad 2356:767,
 * desktop 2356:1071.
 *
 * Centred on the two stacked frames, left-aligned in the desktop's left column.
 * The headline holds its own line break at every width (Figma sets it nowrap),
 * so it is written as two lines rather than left to wrap.
 *
 * Figma nudges the mobile block 3px right of centre (left 50% + 3px); it is
 * centred here, since nothing else in the frame carries that offset.
 *
 * The CTA pair measures exactly 332 — the full width of Figma's mobile block —
 * so it wraps rather than clips on anything narrower than the 402 frame.
 *
 * Desktop hangs off the middle band's centre rather than the stage top: Figma
 * puts the block at y226 in a 173-643 band, which is 31px above that band's
 * centre, and holding the offset rather than the absolute y is what lets the
 * band grow on a tall viewport without stranding the copy at the top.
 */

const EASE_OUT = [0.215, 0.61, 0.355, 1] as const;

export const HeroContent = () => {
  const reduceMotion = useReducedMotion();

  // The reduced-motion branch has to name y and filter, not just drop them:
  // useReducedMotion resolves after the first render, so the animated values
  // have already been applied and motion would leave the element parked at y14.
  const reveal = (delay: number) =>
    reduceMotion
      ? {
        initial: { opacity: 1, y: 0, filter: "blur(0px)" },
        animate: { opacity: 1, y: 0, filter: "blur(0px)" },
      }
      : {
        initial: { opacity: 0, y: 14, filter: "blur(4px)" },
        animate: { opacity: 1, y: 0, filter: "blur(0px)" },
        transition: {
          type: "tween" as const,
          duration: 0.45,
          ease: EASE_OUT,
          delay,
        },
      };

  return (
    <div className="pointer-events-auto absolute top-[125px] left-[calc(50%+3px)] z-20 flex w-[332px] max-w-full -translate-x-1/2 flex-col items-center gap-[40px] ipad:top-[193px] ipad:w-[448px] desktop-sm:top-[calc(50%-31px)] desktop-sm:left-[135px] desktop-sm:w-[519px] desktop-sm:translate-x-0 desktop-sm:-translate-y-1/2 desktop-sm:items-start">
      <div className="flex w-full flex-col items-center gap-[21px] text-center text-white desktop-sm:items-start desktop-sm:text-left">
        <motion.h1
          {...reveal(0)}
          className="font-instrument-serif text-[42px] leading-[1.2] tracking-[-0.84px] whitespace-nowrap ipad:text-[62px] ipad:tracking-[-1.24px]"
        >
          The Coordination
          <br />
          Layer for All Chanins
        </motion.h1>
        <motion.p
          {...reveal(0.09)}
          className="w-[300px] font-tight text-[16px] leading-[1.3] tracking-[-0.32px] text-pretty ipad:w-[448px]"
        >
          Fast, verifiable, and trust-minimized interoperability. Bridge assets,
          route intents,and confirm proof - without trusted relayers.
        </motion.p>
      </div>

      <motion.div
        {...reveal(0.18)}
        className="flex flex-wrap items-start justify-center android-sm:gap-0 iphone:gap-[20px]"
      >
        <Button>Launch Platform</Button>
        <Button variant="ghost">Explore Missions</Button>
      </motion.div>
    </div>
  );
};
