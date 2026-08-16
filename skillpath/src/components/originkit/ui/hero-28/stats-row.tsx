// Delivered by Originkit · stack: nextjs · styling: tailwind
"use client";

/**
 * The three counters — Figma mobile 2356:519, iPad 2356:789, desktop 2356:1260.
 *
 * One row of three from iPad up, with 1px dividers in the 35px gaps. Mobile
 * splits it 2 + 1: the first two share a row with a divider, the third drops to
 * its own line 32px below and takes no divider. The mobile pair sits in a
 * wrapper that `contents` dissolves from iPad up, so all three end in one flex
 * row rather than being rebuilt per breakpoint.
 *
 * Desktop measures the row off the bottom of the stage (Figma's y667 is 52px
 * clear of the 811 frame foot) so it stays with the rule above it when the
 * viewport is taller than that frame.
 *
 * Figma types the mobile "Internts Processed" label at 16px while its two
 * siblings are 14px; all three are 14px here, since the frame renders them the
 * same size and the odd one out is an authoring slip.
 */

type Stat = { label: string; value: string };

const STATS: Stat[] = [
  { label: "Connected Chains", value: "42" },
  { label: "Internts Processed", value: "2.1M" },
  { label: "Total Value Locked", value: "$1.72B" },
];

const Divider = ({ className = "" }: { className?: string }) => (
  <span
    aria-hidden
    className={`h-[92.022px] w-px shrink-0 bg-[#1f1f1f] ${className}`}
  />
);

const Column = ({ label, value }: Stat) => (
  <div className="flex min-w-px flex-1 flex-col items-start gap-[16px] font-tight leading-[1.2] text-white">
    <p className="w-full text-[14px] tracking-[-0.28px] opacity-70 ipad:text-[16px] ipad:tracking-[-0.32px]">
      {label}
    </p>
    <p className="w-full text-[22px] tracking-[-0.44px] ipad:text-[28px] ipad:tracking-[-0.56px]">
      {value}
    </p>
  </div>
);

export const StatsRow = () => (
  <div className="absolute top-[875px] left-[48px] z-20 flex w-[301px] max-w-[calc(100%-96px)] flex-col gap-[32px] motion-safe:animate-section-rise ipad:top-[1040px] ipad:left-[104px] ipad:w-[536px] ipad:flex-row ipad:items-center ipad:gap-[35px] desktop-sm:top-auto desktop-sm:bottom-[52px] desktop-sm:left-[132px]">
    <div className="flex w-full items-center gap-[35px] ipad:contents">
      <Column {...STATS[0]} />
      <Divider />
      <Column {...STATS[1]} />
    </div>
    <Divider className="hidden ipad:block" />
    <div className="w-[108.333px] ipad:contents">
      <Column {...STATS[2]} />
    </div>
  </div>
);
