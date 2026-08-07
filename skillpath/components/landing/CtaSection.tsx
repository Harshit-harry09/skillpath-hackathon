'use client';
// updated

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { motion } from 'framer-motion';
import { ArrowRight, Zap } from 'lucide-react';

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

// ─── CTA Section ─────────────────────────────────────────────────────────────
export function CtaSection() {
  const router = useRouter();
  const { user, openAuthModal } = useAuth();

  const handleAction = () => {
    router.push('/analyze');
  };

  return (
    <section
      className="relative py-16 md:py-28 px-4 sm:px-8 lg:px-24 flex justify-center overflow-hidden"
      style={{ background: 'var(--color-surface-soft)' }}
    >
      <div className="absolute top-0 left-0 right-0 h-1" style={{ background: 'var(--bold-border)' }} />

      <div className="max-w-[1280px] w-full">
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="relative overflow-hidden"
          style={{
            /* Always dark — hardcoded, not a theme variable */
            background: '#0a0a0a',
            border: '3px solid #0a0a0a',
            borderRadius: '24px',
            padding: 'clamp(40px, 6vw, 80px)',
            boxShadow: '10px 10px 0 var(--color-brand-pink)',
          }}
        >
          {/* Grid pattern overlay */}
          <div
            className="absolute inset-0 opacity-[0.04] pointer-events-none"
            style={{ backgroundImage: `linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)`, backgroundSize: '40px 40px' }}
          />

          {/* Corner accent */}
          <div className="absolute top-0 right-0 w-[280px] h-[280px] pointer-events-none" style={{ background: 'var(--color-brand-pink)', clipPath: 'polygon(100% 0, 0 0, 100% 100%)', opacity: 0.12 }} />

          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-10">
            {/* Left: Copy */}
            <div className="space-y-5 max-w-2xl">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-[#ff4d8b] animate-pulse" />
                <span className="font-mono text-[11px] font-black uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.35)' }}>Start Now · Free Forever</span>
              </div>
              <h2 className="font-black leading-[0.92] text-white" style={{ fontSize: 'clamp(40px, 6vw, 80px)', letterSpacing: '-0.04em' }}>
                Stop guessing.<br /><span style={{ color: '#ff4d8b' }}>Start growing.</span>
              </h2>
              <p className="text-[16px] font-medium leading-relaxed max-w-lg" style={{ color: 'rgba(255,255,255,0.55)' }}>
                Whether it's a 10-person startup or a Fortune 500 giant, we'll map your exact route — in seconds, for free.
              </p>

              <div className="flex items-center gap-8 pt-2">
                {[{ val: '5,000+', label: 'engineers' }, { val: 'Free', label: 'forever' }, { val: '< 1s', label: 'analysis time' }].map((s, i) => (
                  <div key={i} className="flex flex-col">
                    <span className="font-black text-[22px] text-white leading-none" style={{ letterSpacing: '-0.03em' }}>{s.val}</span>
                    <span className="font-mono text-[9px] uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.35)' }}>{s.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: CTA button */}
            <div className="flex flex-col gap-3 flex-shrink-0">
              <button
                onClick={handleAction}
                className="group flex items-center gap-3 font-black uppercase tracking-wider transition-all duration-150 active:translate-y-[3px] active:shadow-none"
                style={{
                  background: '#ff4d8b',
                  color: '#fff',
                  fontSize: '15px',
                  letterSpacing: '0.08em',
                  padding: '20px 40px',
                  borderRadius: '14px',
                  border: '3px solid rgba(255,255,255,0.15)',
                  boxShadow: '6px 6px 0 rgba(255,77,139,0.5)',
                  whiteSpace: 'nowrap',
                }}
              >
                <Zap className="w-5 h-5" fill="currentColor" />
                Get My Free Roadmap
                <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              </button>
              <p className="font-mono text-[10px] font-black uppercase tracking-widest text-center" style={{ color: 'rgba(255,255,255,0.25)' }}>
                No signup required · Instant results
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-1" style={{ background: 'var(--bold-border)' }} />
    </section>
  );
}

// ─── Footer ──────────────────────────────────────────────────────────────────
export function Footer() {
  return (
    <footer
      className="w-full flex justify-center px-4 sm:px-8 lg:px-24"
      style={{
        /* Always dark — hardcoded so it doesn't invert in dark mode */
        background: '#0a0a0a',
        borderTop: '3px solid #0a0a0a',
      }}
    >
      <div className="max-w-[1280px] w-full py-8 flex flex-col md:flex-row justify-between items-center gap-5">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: '#ff4d8b', border: '2px solid rgba(255,255,255,0.15)', boxShadow: '2px 2px 0 rgba(255,255,255,0.08)' }}>
            <Zap className="w-4 h-4 text-white" fill="currentColor" />
          </div>
          <span className="font-black text-[18px] text-white" style={{ letterSpacing: '-0.03em' }}>
            Skill<span style={{ color: '#ff4d8b' }}>Path</span>
          </span>
          <span className="hidden md:block h-4 w-px" style={{ background: 'rgba(255,255,255,0.1)' }} />
          <span className="hidden md:block font-mono text-[11px] uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.25)' }}>
            © 2026 SkillPath Inc.
          </span>
        </div>

        {/* Nav links */}
        <div className="hidden md:flex items-center gap-6">
          {['Privacy', 'Terms'].map(link => (
            <button
              key={link}
              type="button"
              className="font-mono text-[11px] font-bold uppercase tracking-widest text-white/25 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-pink rounded"
            >
              {link}
            </button>
          ))}
        </div>

        {/* Social icons */}
        <div className="flex items-center gap-3">
          {[
            { icon: <GitHubIcon size={16} />, href: 'https://github.com/shauryap9006-cell', label: 'GitHub' },
            { icon: <LinkedinIcon size={16} />, href: 'https://www.linkedin.com/in/shaurya-singh-971005357/', label: 'LinkedIn' },
            { icon: <InstagramIcon size={16} />, href: 'https://instagram.com', label: 'Instagram' },
          ].map(({ icon, href, label }) => (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={label}
              className="w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-150 active:translate-y-[1px] bg-white/5 border border-white/10 text-white/45 hover:text-[#ff4d8b] hover:border-[#ff4d8b]/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-pink"
              style={{ boxShadow: '2px 2px 0 rgba(255,255,255,0.04)' }}
            >
              {icon}
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}
