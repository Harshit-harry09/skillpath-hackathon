// Delivered by Originkit · stack: nextjs · styling: tailwind
"use client";

"use client";

import { useEffect, useRef, useState } from "react";

import BlackHole from "@/components/originkit/ui/hero-28/black-hole";

function asset(file: string) {
  return `/originkit/hero-28/${file}`;
}

/**
 * The accretion disc and the hand under it — Figma mobile 2356:514,
 * iPad 2356:784, desktop 2356:1285.
 *
 * Figma ships the disc as a flat PNG, but it is a still of exactly this
 * OriginKit component, so it runs live here instead. Its parameters were
 * recovered from that render rather than guessed:
 *
 *   - the lit pixels have a principal axis at -19.94deg, which is the roll the
 *     component's default `tiltSideway` of 160 produces; Figma then rotates the
 *     whole image a further -2.28deg, so 158 lands the disc at the -22.0deg it
 *     actually sits at on screen and the wrapper needs no rotation of its own
 *   - the projected ellipse measures 0.237 minor over major. Without
 *     perspective that ratio would be sin(tilt); with the component's fixed
 *     1300 depth it comes out at tilt 12
 *   - the art spans 82.6% of the render's width, which needs `outerRadius` 75
 *     rather than the default 70 (79 by the arithmetic, trimmed to 75 after
 *     diffing the running disc against the frame)
 *
 * `voidRadius` is absolute pixels inside the component, not a share of the box,
 * so it cannot be a Tailwind variant and it cannot be a constant either: the
 * disc is 715px wide on desktop and 403px on mobile. It is scaled off the
 * measured width instead, which also keeps it right between breakpoints. The
 * integer rounding is what stops a resize drag re-seeding the particle field on
 * every pixel — one unit of void is about 20px of box.
 *
 * The box itself is one aspect ratio at every frame; only its width and where
 * it hangs on the page change. Because of that the hand lands at the same
 * percentages of the box at all three sizes, so it needs no per-breakpoint
 * geometry at all.
 *
 * Desktop hangs the box off the middle band's centre rather than the stage top.
 * Figma puts it at y76 in a 173-643 band, i.e. 76px above that centre, and
 * holding the offset means the disc and the copy drift down by the same amount
 * when the band opens up on a viewport taller than Figma's 811.
 *
 * Width is the smaller of two things, and the second one is what keeps the art
 * off the brand strip. A share of the stage alone grows with width only: at the
 * 1920 cap it makes the box 978 wide and 683 tall inside a band that is 470,
 * and the hand — which hangs to 114.7% of the box — drops well past the rule the
 * strip sits on. So the box is also capped by the band it lives in, at exactly
 * the overhang Figma draws: the hand's foot sits at `0.6469 * boxH - 76` below
 * the band centre and Figma lets that clear the band's own half-height by 20px,
 * which solves to `boxH <= 0.7729 * bandH + 148.86` and, through the aspect
 * ratio, to the width below. At 1440 x 811 the two agree to a tenth of a pixel,
 * so the reference frame is untouched and only wider or shorter viewports bind.
 */

/** Width of the Figma render the parameters above were measured from. */
const NATIVE_WIDTH = 707;
const NATIVE_VOID = 35;

/**
 * Figma masks the hand with an ellipse under a 13.05px blur, at 50% opacity.
 * A blurred edge is a Gaussian one — alpha at distance d from a boundary R is
 * about Phi((R - d) / sigma) — and the source keeps sigma at 0.1203 of the
 * radius on all three frames, so a single gradient serves every size. The stops
 * run to 1.45R because that is where the falloff finally reaches zero; the
 * wrapper below is sized to that full extent, which is what makes
 * `closest-side` resolve to exactly the right radii.
 */
const HAND_MASK = `radial-gradient(ellipse closest-side at 50% 50%, ${[
  "rgba(0,0,0,1) 0%",
  "rgba(0,0,0,1) 37.9%",
  "rgba(0,0,0,0.994) 48.3%",
  "rgba(0,0,0,0.952) 55.2%",
  "rgba(0,0,0,0.894) 58.6%",
  "rgba(0,0,0,0.797) 62.1%",
  "rgba(0,0,0,0.661) 65.5%",
  "rgba(0,0,0,0.5) 69%",
  "rgba(0,0,0,0.339) 72.4%",
  "rgba(0,0,0,0.203) 75.9%",
  "rgba(0,0,0,0.106) 79.3%",
  "rgba(0,0,0,0.048) 82.8%",
  "rgba(0,0,0,0.019) 86.2%",
  "rgba(0,0,0,0.006) 89.7%",
  "transparent 100%",
].join(", ")})`;

export const BlackHoleVisual = () => {
  const hostRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    setWidth(Math.round(host.getBoundingClientRect().width));
    const observer = new ResizeObserver(([entry]) =>
      setWidth(Math.round(entry.contentRect.width)),
    );
    observer.observe(host);
    return () => observer.disconnect();
  }, []);

  const voidRadius = Math.max(
    1,
    Math.round((NATIVE_VOID * width) / NATIVE_WIDTH),
  );

  return (
    <div
      ref={hostRef}
      className="absolute top-[489px] left-[-2.74%] z-10 aspect-[733.681/512.049] w-[102.84%] ipad:top-[567px] ipad:left-[14.11%] ipad:w-[71.75%] desktop-sm:top-[calc(50%-76px)] desktop-sm:left-[45.21%] desktop-sm:w-[min(50.95%,calc((0.7729*var(--band-h)_+_148.86px)*1.4328))] desktop-sm:-translate-y-1/2"
    >
      {width > 0 && (
        <BlackHole
          style={{ background: "transparent" }}
          tilt={12}
          tiltSideway={158}
          outerRadius={75}
          centre={{ voidRadius, voidX: 50, voidY: 50 }}
        />
      )}

      {/* The vignette box is the ellipse plus its full blur falloff, which is
          why the hand overhangs it slightly on the left.

          Figma puts this box at 50.19%; it sits at 47.19% — three points up.
          The offset is on the box rather than on the `<img>` inside it so the
          mask travels with the hand: moved on the image alone, the hand slides
          out from under its own vignette and the falloff stops matching the
          fingers. Everything here is a percentage of the visual, so the lift
          re-pitches with the frame instead of drifting at one width. */}
      <div
        aria-hidden
        className="pointer-events-none absolute top-[47.19%] left-[37.11%] h-[67.5%] w-[42.85%]"
        style={{ maskImage: HAND_MASK, WebkitMaskImage: HAND_MASK }}
      >
        <img
          src={asset("hand.png")}
          alt=""
          className="absolute top-[6.76%] left-[-3.11%] h-[100.94%] w-[110.88%] max-w-none opacity-50"
        />
      </div>
    </div>
  );
};
