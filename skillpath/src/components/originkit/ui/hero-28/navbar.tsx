// Delivered by Originkit · stack: nextjs · styling: tailwind
"use client";

function asset(file: string) {
  return `/originkit/hero-28/${file}`;
}

/**
 * Top navigation — Figma mobile 2356:745, iPad 2356:1015, desktop 2356:1272.
 *
 * The links and the "Start Free" pill are desktop-only; the stacked frames swap
 * both for a hamburger.
 *
 * Height is the first horizontal rule (42 / 62 / 80), so the bar always sits in
 * the band the rule closes. Mobile and desktop centre their content in that
 * band; iPad puts it at y39.5 in a 62px band, which is 8.5px low, so the pad
 * pushes it there rather than pretending the frames agree.
 *
 * The gutters are Figma's own (58 / 82 / 116), wider than the vertical rails
 * they sit inside. Desktop inherits that 116px inset on the 1920 stage — same
 * rail→logo gap as the 1440 frame, not a scaled-up padding — so the wordmark
 * and "Start Free" track the rails as the stage opens past 1440.
 */

const NAV_LINKS = ["Platform", "Solutions", "Resources", "Pricing"] as const;

const LINK_CLASS =
  "flex min-h-11 items-center font-tight text-[17px] leading-[25.5px] tracking-[-0.34px] whitespace-nowrap text-white" +
  " transition-opacity duration-200 ease-out" +
  " focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white" +
  " [@media(hover:hover)_and_(pointer:fine)]:hover:opacity-70";

export const Navbar = () => (
  <nav
    aria-label="Primary"
    className="relative z-30 flex h-[42px] w-full items-center justify-between px-[58px] ipad:h-[62px] ipad:px-[82px] ipad:pt-[17px] desktop-sm:h-[80px] desktop-sm:px-[116px] desktop-sm:pt-0"
  >
    <div className="flex items-center">
      <a
        href="#"
        aria-label="Zentra home"
        className="flex items-center gap-[5.538px] rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white ipad:gap-2"
      >
        <img
          src={asset("logo-mark.svg")}
          alt=""
          aria-hidden
          className="block size-[15.231px] max-w-none ipad:size-[22px]"
        />
        <span className="font-sans text-[13.846px] leading-[17.654px] font-semibold tracking-[-0.2769px] whitespace-nowrap text-white ipad:text-[20px] ipad:leading-[25.5px] ipad:tracking-[-0.4px]">
          Zentra
        </span>
      </a>

      {/* Desktop link row — 52px off the wordmark, 24px apart (2356:1277) */}
      <ul className="ml-[52px] hidden items-center gap-6 desktop-sm:flex">
        {NAV_LINKS.map((link) => (
          <li key={link}>
            <a href="#" className={LINK_CLASS}>
              {link}
            </a>
          </li>
        ))}
      </ul>
    </div>

    {/* Desktop CTA (2356:1283) */}
    <button
      type="button"
      className="hidden cursor-pointer items-center justify-center rounded-[12px] border border-solid border-white/10 bg-white/[0.02] px-[20px] py-[12px] font-tight text-[16px] leading-[normal] font-medium tracking-[-0.48px] whitespace-nowrap text-white transition-colors duration-200 ease-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white active:scale-[0.97] motion-reduce:active:scale-100 desktop-sm:flex [@media(hover:hover)_and_(pointer:fine)]:hover:bg-white/10"
    >
      Start Free
    </button>

    {/* Stacked frames get a hamburger instead (2356:749 / 2356:1019). Figma's
        24px icon is too small to press, so the target is 44px and the negative
        margin keeps the glyph itself on the gutter Figma set. */}
    <button
      type="button"
      aria-label="Open menu"
      className="-mr-2.5 flex size-11 cursor-pointer items-center justify-center touch-manipulation [-webkit-tap-highlight-color:transparent] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white active:scale-[0.97] motion-reduce:active:scale-100 desktop-sm:hidden"
    >
      <img
        src={asset("menu.svg")}
        alt=""
        aria-hidden
        className="block size-6 max-w-none"
      />
    </button>
  </nav>
);
