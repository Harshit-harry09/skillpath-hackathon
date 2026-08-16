// Delivered by Originkit · stack: nextjs · styling: tailwind
"use client";

function asset(file: string) {
  return `/originkit/hero-28/${file}`;
}

/**
 * The brand strip — Figma mobile 2356:531, iPad 2356:801, desktop 2356:1088.
 *
 * Figma holds a 1139px track inside a 683px window and masks it with an
 * ellipse, i.e. a scrolling row frozen for the still. It scrolls here, off the
 * shared `logo-marquee` keyframe, with two identical halves in one w-max track;
 * one half already runs ~1300px, comfortably past the widest window.
 *
 * Figma's still overhangs the rails on every frame — mobile by 26px / 52px,
 * iPad by 11px / 50px — which a frozen export can afford because the mask alpha
 * out there is near zero and the track happens to have gaps in both tails.
 * Scrolling, it cannot: every glyph eventually crosses those pixels and reads
 * as the strip bleeding past a rule. The window is pinned to the vertical rails
 * at every width instead (32 / 62 / middle-to-right on desktop), and the
 * ellipse fade is sized as a share of that window so alpha is ~0 at the rails.
 *
 * Desktop also measures off the bottom of the stage, so the strip stays with
 * the rule above it when the viewport is taller than Figma's 811 frame.
 *
 * Figma's mask is an ellipse under a 26px blur, which is a Gaussian edge rather
 * than a hard one. The one-dimensional Phi((R - d) / sigma) approximation is not
 * enough here: the ellipse is 599 wide but only 72 tall against that same 26px
 * blur, so what dominates is the vertical chord shrinking as you move outward —
 * the strip is already dimming at half a radius, where a purely horizontal
 * falloff would still read as solid. The stops below are the actual 2D
 * convolution sampled along the centre line, which is why they start at 0.688
 * (the blur never lets the middle reach opaque, and 0.688 of #e0e0e0 is the 154
 * the Figma strip measures) and why the fade begins so early.
 *
 * Sampled at u = d/R in 0.05 steps and placed at u/1.25, since 1.25R is where
 * the profile finally reaches zero.
 */

type Brand = { name: string; src: string; w: number; h: number };

/** Glyph boxes as Figma draws them, in desktop pixels. */
const BRANDS: Brand[] = [
  { name: "Logiqo", src: asset("brand-logiqo.svg"), w: 83.875, h: 27.958 },
  { name: "Nexora", src: asset("brand-nexora.svg"), w: 86.975, h: 28.056 },
  {
    name: "Brandly",
    src: asset("brand-brandly.svg"),
    w: 90.194,
    h: 28.011,
  },
  {
    name: "Markivo",
    src: asset("brand-markivo.svg"),
    w: 93.371,
    h: 27.956,
  },
  { name: "Typely", src: asset("brand-typely.svg"), w: 92.786, h: 26.012 },
  { name: "Framex", src: asset("brand-framex.svg"), w: 89.467, h: 27.958 },
  { name: "Webora", src: asset("brand-webora.svg"), w: 92.388, h: 27.996 },
  {
    name: "Designo",
    src: asset("brand-designo.svg"),
    w: 95.14,
    h: 27.982,
  },
  { name: "Formix", src: asset("brand-formix.svg"), w: 83.942, h: 27.981 },
];

/**
 * Mobile draws the same strip at 0.702 of the desktop size (19.65px glyphs
 * against 28px). One variable carries that, so every glyph and the 53.4px gap
 * between them re-pitch from a single number.
 */
const SCALE = "[--logo-scale:0.702] ipad:[--logo-scale:1]";

const FADE = [
  "rgba(0,0,0,0.688) 0%",
  "rgba(0,0,0,0.682) 16%",
  "rgba(0,0,0,0.665) 28%",
  "rgba(0,0,0,0.634) 40%",
  "rgba(0,0,0,0.601) 48%",
  "rgba(0,0,0,0.552) 56%",
  "rgba(0,0,0,0.517) 60%",
  "rgba(0,0,0,0.472) 64%",
  "rgba(0,0,0,0.411) 68%",
  "rgba(0,0,0,0.331) 72%",
  "rgba(0,0,0,0.238) 76%",
  "rgba(0,0,0,0.145) 80%",
  "rgba(0,0,0,0.073) 84%",
  "rgba(0,0,0,0.029) 88%",
  "rgba(0,0,0,0.009) 92%",
  "transparent 100%",
].join(", ");

/**
 * `--fade-r` is 1.25 x the ellipse's own radius, `--fade-cx` its centre — both
 * as a share of the window, so the fade re-fits when the window does. The
 * vertical radius is deliberately oversized: that axis is already carried by
 * the profile above and must not be applied twice.
 */
const FADE_MASK = `radial-gradient(ellipse var(--fade-r) 200% at var(--fade-cx) 50%, ${FADE})`;

/**
 * The trailing pad is load-bearing: the track shifts by exactly -50%, so each
 * half has to carry its own joining gap. With the gap on the track instead, the
 * loop lands half a gap short and the seam shows on every pass.
 */
const Half = ({ hidden = false }: { hidden?: boolean }) => (
  <ul
    aria-hidden={hidden || undefined}
    aria-label={hidden ? undefined : "Trusted by"}
    className="flex shrink-0 items-center gap-[calc(var(--logo-scale)*53.4px)] pr-[calc(var(--logo-scale)*53.4px)]"
  >
    {BRANDS.map((brand) => (
      <li key={brand.name} className="shrink-0">
        <img
          src={brand.src}
          alt={hidden ? "" : brand.name}
          className="block max-w-none"
          style={{
            width: `calc(var(--logo-scale) * ${brand.w}px)`,
            height: `calc(var(--logo-scale) * ${brand.h}px)`,
          }}
        />
      </li>
    ))}
  </ul>
);

/** Marquee window inset — matches `RAIL_L` / `RAIL_R` in `grid-frame.tsx`. */
const RAIL_WINDOW =
  "left-[32px] right-[32px] ipad:left-[62px] ipad:right-[62px] desktop-sm:left-1/2 desktop-sm:right-[80px]";

export const LogoMarquee = () => (
  <div
    className={`${SCALE} ${RAIL_WINDOW} absolute top-[1115px] z-20 h-[52px] overflow-hidden [--fade-cx:50.6%] [--fade-r:54.8%] ipad:top-[1183px] ipad:h-[74px] desktop-sm:top-auto desktop-sm:bottom-[66px]`}
    style={{ maskImage: FADE_MASK, WebkitMaskImage: FADE_MASK }}
  >
    <div className="flex h-full w-max items-center will-change-transform motion-safe:animate-logo-marquee">
      <Half />
      <Half hidden />
    </div>
  </div>
);
