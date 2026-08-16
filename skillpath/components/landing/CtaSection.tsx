'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Zap, ArrowRight } from 'lucide-react';
import DitherReveal from '@/components/originkit/dither-reveal';

const GitHubIcon = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
  </svg>
);

const LinkedinIcon = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect width="4" height="12" x="2" y="9" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);

const InstagramIcon = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);

// ─── Full-Screen Dither Reveal CTA Section ─────────────────────────────────────
export function CtaSection() {
  const router = useRouter();
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const checkDark = () => {
      setIsDark(document.documentElement.classList.contains('dark'));
    };
    checkDark();
    const observer = new MutationObserver(checkDark);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  return (
    <section
      className="relative w-full min-h-screen overflow-hidden text-[#1F3A4B] dark:text-white transition-colors duration-300 flex flex-col justify-between"
      style={{ background: isDark ? '#0a0a0a' : 'var(--color-canvas)' }}
    >
      {/* WebGL Dither Shader Background */}
      <div className="absolute inset-0 w-full h-full pointer-events-auto">
        <DitherReveal
          image="/images/hands.jpg"
          fit="cover"
          focusY={50}
          ditherStyle="bayer8"
          dotSize={5}
          revealRadius={112}
          revealSoftness={50}
          wave={true}
          waveSpeed={80}
          waveDensity={25}
          rotate={0}
          invert={!isDark}
          style={{ width: '100%', height: '100%' }}
        />
      </div>

      {/* Main Overlay Content — 3-Column Split */}
      <div className="relative z-10 w-full max-w-[1400px] mx-auto min-h-screen px-6 sm:px-12 lg:px-16 py-12 flex flex-col lg:flex-row items-center justify-between gap-8 pointer-events-none">
        
        {/* Left Column: Headline & Description */}
        <div className="w-full lg:w-5/12 flex flex-col items-start gap-4 text-left pointer-events-auto">
          <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full font-mono text-xs font-bold uppercase tracking-widest bg-surface-card text-[#1F3A4B] border border-hairline dark:bg-white/10 dark:text-[#ff4d8b] dark:border-[#ff4d8b]/30 backdrop-blur-md shadow-sm">
            <span className="w-2 h-2 rounded-full bg-[#ff4d8b] animate-pulse" />
            SkillPath AI Roadmap
          </span>

          <h2 className="font-comico text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.08] uppercase text-[#1F3A4B] dark:text-white drop-shadow-sm">
            STOP GUESSING. <br />
            <span className="text-[#ff4d8b]">START GROWING.</span>
          </h2>

          <p className="font-zodiak text-base sm:text-lg text-[#1F3A4B]/90 dark:text-slate-300 font-medium leading-relaxed max-w-md">
            Map your tech career trajectory in seconds with real-time AI market intelligence.
          </p>
        </div>

        {/* Center Column: ONLY THE BUTTON positioned right between the hands */}
        <div className="w-full lg:w-2/12 flex items-center justify-center pointer-events-auto my-4 lg:my-0">
          <button
            onClick={() => router.push('/analyze')}
            className="group relative inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-[#1F3A4B] text-white dark:bg-black dark:text-white border-2 border-[#1F3A4B] dark:border-[#ff4d8b]/70 font-comico uppercase text-xs sm:text-sm font-bold tracking-widest shadow-[0_4px_16px_rgba(31,58,75,0.25)] dark:shadow-[0_0_22px_rgba(255,77,139,0.45)] hover:scale-[1.05] active:scale-[0.96] transition-all duration-200 cursor-pointer whitespace-nowrap"
          >
            <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current text-[#C2F84F] dark:text-[#ff4d8b] group-hover:rotate-12 transition-transform duration-200" />
            <span>Roadmap</span>
            <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform duration-200 group-hover:translate-x-1" />
          </button>
        </div>

        {/* Right Column: Stats Cards Stack */}
        <div className="w-full lg:w-5/12 flex flex-col items-center lg:items-end gap-3.5 pointer-events-auto">
          {[
            { val: '5,000+', label: 'ENGINEERS', sub: 'Accelerating tech careers' },
            { val: 'FREE', label: 'FOREVER', sub: 'No credit card needed' },
            { val: '< 1S', label: 'ANALYSIS TIME', sub: 'Real-time AI skill mapping' },
          ].map((card, idx) => (
            <div
              key={idx}
              className="w-full max-w-xs bg-surface-card/95 border border-hairline/80 dark:bg-black/60 dark:border-white/10 p-4 rounded-2xl backdrop-blur-md shadow-md hover:border-[#ff4d8b]/40 transition-colors flex flex-col gap-0.5"
            >
              <div className="flex items-center gap-2">
                <span className="font-comico text-xl sm:text-2xl text-[#1F3A4B] dark:text-white font-bold leading-none">{card.val}</span>
                <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-[#ff4d8b]">{card.label}</span>
              </div>
              <span className="font-zodiak text-xs text-[#1F3A4B]/80 dark:text-slate-400 font-medium">{card.sub}</span>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}

// ─── Footer ──────────────────────────────────────────────────────────────────
export function Footer() {
  return (
    <footer className="w-full bg-canvas dark:bg-[#0a0a0a] border-t border-hairline dark:border-white/10 transition-colors duration-300">
      <div className="max-w-[1280px] mx-auto px-6 sm:px-10 lg:px-16">

        {/* Top row: brand + nav links */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 py-10 border-b border-hairline dark:border-white/10">

          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-[#1F3A4B] dark:bg-[#ff4d8b] shadow-sm shrink-0">
              <span className="font-black text-white text-sm leading-none">⚡</span>
            </div>
            <div className="flex flex-col">
              <span
                className="font-black text-[18px] text-[#1F3A4B] dark:text-white leading-none"
                style={{ letterSpacing: '-0.03em' }}
              >
                Skill<span className="text-[#ff4d8b]">Path</span>
              </span>
              <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#1F3A4B]/50 dark:text-white/35 mt-0.5">
                Neural Career Intelligence
              </span>
            </div>
          </div>

          {/* Nav links */}
          <nav className="flex items-center gap-1 flex-wrap">
            {[
              { label: 'Privacy', href: '#' },
              { label: 'Terms', href: '#' },
              { label: 'GitHub', href: 'https://github.com/shauryap9006-cell' },
              { label: 'LinkedIn', href: 'https://www.linkedin.com/in/shaurya-singh-971005357/' },
            ].map(({ label, href }) => (
              <a
                key={label}
                href={href}
                target={href.startsWith('http') ? '_blank' : undefined}
                rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
                className="px-3 py-1.5 font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-[#1F3A4B]/55 hover:text-[#ff4d8b] dark:text-white/40 dark:hover:text-[#ff4d8b] transition-colors rounded-md hover:bg-[#ff4d8b]/5 dark:hover:bg-[#ff4d8b]/10"
              >
                {label}
              </a>
            ))}
          </nav>
        </div>

        {/* Bottom row: copyright + social */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-5">
          <span className="font-mono text-[11px] uppercase tracking-wider text-[#1F3A4B]/40 dark:text-white/30">
            © 2026 SkillPath Inc. — All rights reserved.
          </span>

          {/* Social icons */}
          <div className="flex items-center gap-2">
            {[
              { icon: <GitHubIcon size={15} />, href: 'https://github.com/shauryap9006-cell', label: 'GitHub' },
              { icon: <LinkedinIcon size={15} />, href: 'https://www.linkedin.com/in/shaurya-singh-971005357/', label: 'LinkedIn' },
              { icon: <InstagramIcon size={15} />, href: 'https://instagram.com', label: 'Instagram' },
            ].map(({ icon, href, label }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-150 border border-hairline dark:border-white/10 text-[#1F3A4B]/50 dark:text-white/50 hover:text-[#ff4d8b] hover:border-[#ff4d8b]/40 hover:bg-[#ff4d8b]/5 dark:hover:bg-[#ff4d8b]/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff4d8b]"
              >
                {icon}
              </a>
            ))}
          </div>
        </div>

      </div>
    </footer>
  );
}



