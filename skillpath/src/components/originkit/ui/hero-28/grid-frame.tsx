// Delivered by Originkit · stack: nextjs · styling: tailwind
"use client";

/**
 * The ruled frame behind everything — Figma mobile 2356:481, iPad 2356:751,
 * desktop 2356:1021.
 *
 * Figma draws this as loose siblings: seven 1440px-wide lines, two vertical
 * ones, fourteen "Union" boolean shapes and a pair of 4MB dotted mask groups.
 * It is really one system — a horizontal rule, and wherever that rule crosses a
 * vertical one, a brighter tick marks the crossing. Modelled that way here, so
 * a tick cannot drift off its rule when a breakpoint moves it.
 *
 * Four rules survive at every width. The two bracketing the second dot band and
 * the one under the logo row exist only while the page is stacked: desktop sets
 * copy and visual side by side and needs no seam there.
 *
 * The horizontal rules bleed to the viewport — Figma's are 1440 wide inside a
 * 402 frame, i.e. deliberately wider than the page. Everything anchored to a
 * vertical rail stays inside the capped stage instead, because the content
 * columns are measured from those rails (the headline sits at rail + 52px).
 *
 * Desktop opens that stage to 1920 (Figma's frame is 1440) so the rails track
 * the same box as the nav and content rather than stopping at 1440 while the
 * stage keeps growing.
 *
 * Figma's right rail lands a pixel short of mirroring the left one on iPad
 * (61.5 vs 62.5) and desktop (79 vs 80); both are symmetric here.
 */

const RULE = "bg-[#1f1f1f]";
const TICK = "bg-[#4c4c4c]";

/** Vertical rail insets — 32.5 / 62.5 / 80 in Figma. */
const RAIL_L = "left-[32px] ipad:left-[62px] desktop-sm:left-[80px]";
const RAIL_R = "right-[32px] ipad:right-[62px] desktop-sm:right-[80px]";

type TickVariant = "cross" | "arm" | "tee";

type Rule = {
  /** Also positions the rule's ticks, so the two can never disagree. */
  y: string;
  end: TickVariant;
  /** Tick where the rule meets the desktop-only middle rail. */
  centre?: TickVariant;
  /**
   * Desktop measures the last two rules off the bottom of the stage instead of
   * the top, so the stats-and-brands band stays on the fold when the viewport
   * is taller than Figma's 811. The tick has to flip its offset to match.
   */
  anchor?: "bottom";
};

const RULES: Rule[] = [
  {
    y: "top-[42px] ipad:top-[62px] desktop-sm:top-[80px]",
    end: "cross",
    centre: "tee",
  },
  {
    y: "top-[95px] ipad:top-[136px] desktop-sm:top-[173px]",
    end: "arm",
    centre: "cross",
  },
  { y: "top-[485px] ipad:top-[551px] desktop-sm:hidden", end: "arm" },
  { y: "top-[537px] ipad:top-[622px] desktop-sm:hidden", end: "arm" },
  {
    y: "top-[857px] ipad:top-[1024px] desktop-sm:top-auto desktop-sm:bottom-[167px]",
    end: "arm",
    centre: "cross",
    anchor: "bottom",
  },
  {
    y: "top-[1097px] ipad:top-[1148px] desktop-sm:top-auto desktop-sm:bottom-[37px]",
    end: "arm",
    centre: "cross",
    anchor: "bottom",
  },
  { y: "top-[1187px] ipad:top-[1281px] desktop-sm:hidden", end: "arm" },
];

/**
 * The dotted bands. Figma masks a field of 12,810 rounded squares over a solid
 * bar, which exports as a 4MB SVG; the rendered result is just that bar
 * dissolved into dots, so it is a tile here instead. Measured off the source:
 * 2.911 x 2.922 squares with a 0.42 corner on a 5.158 x 4.528 pitch (the field
 * is rotated 90deg in Figma, so its x pitch is the screen's y). The field is
 * identical at all three frames — only the band height changes — which is why
 * one background-size serves everywhere. #909090 at 10% peaks at 24 on the
 * #0a0a0a page, which is what Figma's band measures.
 */
const DOT_TILE = `url("data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="51.58" height="45.28"><rect width="29.11" height="29.22" rx="4.2" fill="#909090" fill-opacity="0.1"/></svg>',
)}")`;

const BAND = `absolute bg-[length:5.158px_4.528px] left-[32px] right-[32px] ipad:left-[62px] ipad:right-[62px] desktop-sm:left-[80px] desktop-sm:right-[80px]`;

type TickProps = {
  variant: TickVariant;
  /** Mirrors an arm/cross onto the right-hand rail. */
  flip?: boolean;
  anchor?: "bottom";
  className: string;
};

/**
 * A crossing marker. Figma ships each as a filled boolean shape — a plus at a
 * full crossing, a half-plus where the arm has only one side to run into, and a
 * tee where the middle rail begins. All three are two 1px bars, so they are
 * drawn rather than exported. 16px arms on mobile, 20px from iPad up.
 */
const Tick = ({ variant, flip = false, anchor, className }: TickProps) => {
  // A top offset centres the tick by pulling up half its height; a bottom one
  // has to push down by the same amount instead.
  const centreOnRule =
    anchor === "bottom"
      ? "-translate-y-1/2 desktop-sm:translate-y-1/2"
      : "-translate-y-1/2";

  if (variant === "tee") {
    return (
      <span className={`absolute h-2.5 w-5 -translate-x-1/2 ${className}`}>
        <span className={`${TICK} absolute top-0 left-0 h-px w-full`} />
        <span
          className={`${TICK} absolute top-0 left-1/2 h-full w-px -translate-x-1/2`}
        />
      </span>
    );
  }

  if (variant === "cross") {
    return (
      <span
        className={`absolute size-4 ipad:size-5 ${centreOnRule} ${
          flip ? "translate-x-1/2" : "-translate-x-1/2"
        } ${className}`}
      >
        <span
          className={`${TICK} absolute top-0 left-1/2 h-full w-px -translate-x-1/2`}
        />
        <span
          className={`${TICK} absolute top-1/2 left-0 h-px w-full -translate-y-1/2`}
        />
      </span>
    );
  }

  // Half-plus: the bar sits on the rail, the arm reaches into the page.
  return (
    <span
      className={`absolute h-4 w-2 ipad:h-5 ipad:w-2.5 ${centreOnRule} ${className}`}
    >
      <span
        className={`${TICK} absolute top-1/2 left-0 h-px w-full -translate-y-1/2`}
      />
      <span
        className={`${TICK} absolute top-0 h-full w-px ${flip ? "right-0" : "left-0"}`}
      />
    </span>
  );
};

/**
 * The three vertical rails, split out from the grid because they answer to a
 * different box.
 *
 * Every horizontal rule in `GridFrame` is placed against a frame y — two of
 * them measured from the bottom, since they are the rules the stats row and the
 * brand marquee sit on — so the grid has to stay the height of the stage or
 * that closing pair walks away from the bands it rules. The rails have no such
 * tie: they are pattern, and pattern runs to the bottom of the screen. Kept in
 * the stage they broke off mid-page on anything taller than the frame.
 *
 * The middle rail still starts at the first rule rather than at the top edge,
 * which is where Figma opens it.
 */
export const GridRails = () => (
  <div
    aria-hidden
    className="pointer-events-none absolute inset-y-0 left-1/2 z-[1] w-full max-w-[402px] -translate-x-1/2 ipad:max-w-[744px] desktop-sm:max-w-[1920px]"
  >
    <div className={`${RULE} absolute inset-y-0 w-px ${RAIL_L}`} />
    <div className={`${RULE} absolute inset-y-0 w-px ${RAIL_R}`} />
    <div
      className={`${RULE} absolute top-[80px] bottom-0 left-1/2 hidden w-px -translate-x-1/2 desktop-sm:block`}
    />
  </div>
);

export const GridFrame = () => (
  <div aria-hidden className="pointer-events-none absolute inset-0 z-[1]">
    {/* Horizontal rules — full bleed, wider than the stage as in Figma */}
    {RULES.map((rule) => (
      <div
        key={rule.y}
        className={`${RULE} absolute inset-x-0 h-px ${rule.y}`}
      />
    ))}

    <div className="relative mx-auto h-full w-full max-w-[402px] ipad:max-w-[744px] desktop-sm:max-w-[1920px]">
      {/* Dotted bands. The second is the seam between copy and visual while the
          page is stacked; desktop has no such seam. */}
      <div
        className={`${BAND} top-[42px] h-[53px] ipad:top-[62px] ipad:h-[74px] desktop-sm:top-[80px] desktop-sm:h-[93px]`}
        style={{ backgroundImage: DOT_TILE }}
      />
      <div
        className={`${BAND} top-[485px] h-[52px] ipad:top-[551px] ipad:h-[71px] desktop-sm:hidden`}
        style={{ backgroundImage: DOT_TILE }}
      />

      {RULES.map((rule) => (
        <div key={rule.y} className="contents">
          <Tick
            variant={rule.end}
            anchor={rule.anchor}
            className={`${rule.y} ${RAIL_L}`}
          />
          <Tick
            variant={rule.end}
            flip
            anchor={rule.anchor}
            className={`${rule.y} ${RAIL_R}`}
          />
          {rule.centre ? (
            <Tick
              variant={rule.centre}
              anchor={rule.anchor}
              className={`left-1/2 hidden desktop-sm:block ${rule.y}`}
            />
          ) : null}
        </div>
      ))}
    </div>
  </div>
);
