// Delivered by Originkit · stack: nextjs · styling: tailwind
"use client";

import { BlackHoleVisual } from "@/components/originkit/ui/hero-28/black-hole-visual";
import { GridFrame, GridRails } from "@/components/originkit/ui/hero-28/grid-frame";
import { HeroContent } from "@/components/originkit/ui/hero-28/hero-content";
import { LogoMarquee } from "@/components/originkit/ui/hero-28/logo-marquee";
import { Navbar } from "@/components/originkit/ui/hero-28/navbar";
import { StatsRow } from "@/components/originkit/ui/hero-28/stats-row";

/**
 * Figma frames:
 * - Mobile  2356:481  — 402 x 1233
 * - iPad    2356:751  — 744 x 1330  (`ipad:`)
 * - Desktop 2356:1021 — 1440 x 811  (`desktop-sm:`), stage capped at 1920
 *
 * The frame heights are load-bearing. Every rule, band and block in this design
 * is placed against a ruled grid at a fixed frame y, and the two stacked frames
 * are more than half again as tall as the desktop one because they run copy,
 * visual, stats and brands down a single column where desktop sets copy against
 * visual either side of a middle rail. So the stage carries all three heights
 * and each block is positioned into it, rather than flowed.
 *
 * Desktop width is the Figma 1440 frame opened to a 1920 cap: rails, nav and
 * content share that stage so the wordmark and "Start Free" stay on the outer
 * rails past 1440. The visual is the other fluid piece — `BlackHoleVisual`
 * takes its width as a share of the stage, so the disc keeps its place relative
 * to the rails through the stretch instead of hanging off a 1440-only number.
 *
 * Height is two decisions, not one. `<main>` takes `min-h-dvh` so the page runs
 * to the bottom of any screen. The stacked frames keep their own heights — they
 * are already taller than the phones and tablets they run on. Desktop takes
 * Figma's 811 as a floor and follows the viewport up to 1142, past which the
 * bands drift so far apart that the design reads as three strips rather than one
 * screen; beyond that the surplus is background below the stage. `--stage-h`
 * carries that one number, and `--band-h` the middle band it leaves once the nav
 * (173) and the stats-and-brands band (168) have taken their fixed share — the
 * visual sizes itself off it, so a wide short viewport cannot push the disc
 * through the rule below it. The middle band is transparent to the pointer so it
 * cannot swallow nav clicks.
 */
export const SectionHero = () => (
  <main className="animate-hero-reveal relative isolate min-h-dvh w-full overflow-hidden bg-[#0a0a0a]">
    {/*
      Rails first, grid second — the order is load-bearing. Every crossing marker
      lives in `GridFrame` and draws its own bright vertical bar over the rail it
      sits on; that bar is what makes a marker read as a plus rather than a dash.
      With the rails painting last they covered it, and the half-plusses at the
      rails lost their stem entirely.
    */}
    <GridRails />

    <div className="relative h-[1233px] w-full [--stage-h:clamp(811px,100dvh,1142px)] ipad:h-[1330px] desktop-sm:h-[var(--stage-h)]">
      {/*
        The horizontal grid belongs to the stage, not to the screen. Every rule
        in it is placed against a frame y and two of them are measured from the
        bottom — they are the rules the stats row and the brand marquee sit on.
        Running the grid the full height of `<main>` pushed that closing pair
        down to the bottom of the viewport, away from the bands they rule.

        The vertical rails are the opposite case and hang off `<main>` instead;
        see `GridRails`.
      */}
      <GridFrame />

      <div className="relative z-10 mx-auto h-full w-full max-w-[402px] ipad:max-w-[744px] desktop-sm:max-w-[1920px]">
        <Navbar />

        <div className="pointer-events-none absolute inset-0 [--band-h:calc(var(--stage-h)-341px)] desktop-sm:top-[173px] desktop-sm:bottom-[168px]">
          <HeroContent />
          <BlackHoleVisual />
        </div>

        <StatsRow />
        <LogoMarquee />
      </div>
    </div>
  </main>
);

export default SectionHero;
