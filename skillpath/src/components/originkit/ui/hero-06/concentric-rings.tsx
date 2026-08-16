// Delivered by Originkit · stack: nextjs · styling: tailwind
"use client";

import { motion, useReducedMotion } from "motion/react";
import type { CSSProperties } from "react";
import { PixelBackground } from "@/components/originkit/ui/hero-06/pixel-background";

/** Public asset URLs — use a function so preview rewriters stay stable. */
function asset(file: string) {
  return `/originkit/hero-06/${file}`;
}

/** ease-out-cubic */
const EASE_OUT = [0.215, 0.61, 0.355, 1] as const;

const OUTER_SIZE = "clamp(700px, 120vw, 1300px)";
const INNER_SIZE = "clamp(360px, 60vw, 560px)";

const OUTER_RING = {
  src: asset("rings-ring-outer.svg"),
  size: OUTER_SIZE,
  opacity: "opacity-15 dark:opacity-20",
  direction: "normal" as const,
  duration: "32s",
};

const INNER_RING = {
  src: asset("rings-ring-inner.svg"),
  size: INNER_SIZE,
  opacity: "opacity-15 dark:opacity-25",
  direction: "normal" as const,
  duration: "24s",
};

const SOFT_RINGS = [
  {
    src: asset("rings-ring-outer-soft.png"),
    size: "clamp(750px, 130vw, 1400px)",
    opacity: "opacity-[0.1] dark:opacity-[0.15]",
    direction: "reverse" as const,
    duration: "40s",
  },
  {
    src: asset("rings-ring-inner-soft.png"),
    size: "clamp(380px, 65vw, 600px)",
    opacity: "opacity-[0.12] dark:opacity-[0.18]",
    direction: "reverse" as const,
    duration: "28s",
  },
] as const;

const RingLayer = ({
  src,
  size,
  opacity,
  direction,
  duration,
  reduceMotion,
}: {
  src: string;
  size: string;
  opacity: string;
  direction: "normal" | "reverse";
  duration: string;
  reduceMotion: boolean | null;
}) => (
  <div
    className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 ${opacity}`}
    style={{ width: size, height: size } as CSSProperties}
  >
    <div
      className={`size-full motion-safe:animate-ring-rotate ${
        direction === "reverse"
          ? "motion-safe:[animation-direction:reverse]"
          : ""
      } ${reduceMotion ? "motion-reduce:animate-none" : ""}`}
      style={{ animationDuration: duration } as CSSProperties}
    >
      <img
        src={src}
        alt=""
        className="size-full object-contain"
        draggable={false}
      />
    </div>
  </div>
);

export const ConcentricRings = () => {
  const reduceMotion = useReducedMotion();

  return (
    <div
      className="pointer-events-none absolute inset-0 z-[1] overflow-hidden"
      aria-hidden="true"
    >
      <motion.div
        className="relative size-full"
        initial={
          reduceMotion ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.94 }
        }
        animate={{ opacity: 1, scale: 1 }}
        transition={
          reduceMotion
            ? { duration: 0 }
            : { type: "tween", duration: 0.5, ease: EASE_OUT }
        }
      >
        {/* Pixel backdrop */}
        <div className="absolute inset-0 z-0 opacity-40 dark:opacity-20">
          <PixelBackground />
        </div>

        {/* Animated concentric rings */}
        <div className="absolute inset-0 z-10">
          <RingLayer {...SOFT_RINGS[0]} reduceMotion={reduceMotion} />
          <RingLayer {...OUTER_RING} reduceMotion={reduceMotion} />
          <RingLayer {...SOFT_RINGS[1]} reduceMotion={reduceMotion} />
          <RingLayer {...INNER_RING} reduceMotion={reduceMotion} />
        </div>
      </motion.div>
    </div>
  );
};
