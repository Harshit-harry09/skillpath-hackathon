'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';

export function CtaSection() {
  const router = useRouter();
  const { user, openAuthModal } = useAuth();

  const handleAction = () => {
    if (user) {
      router.push('/analyze');
    } else {
      openAuthModal();
    }
  };

  return (
    <section className="bg-transparent py-section px-8 lg:px-24 flex justify-center">
      <div className="max-w-[1280px] w-full bg-surface-strong rounded-[32px] p-[48px] md:p-[64px] text-center flex flex-col items-center border border-hairline shadow-sm relative overflow-hidden group">
        {/* Subtle background glow */}
        <div className="absolute -inset-1 bg-gradient-to-r from-brand-pink/5 to-brand-teal/5 rounded-[32px] blur-xl opacity-0 group-hover:opacity-100 transition duration-1000" />

        <h2 className="relative z-10 font-display text-[32px] md:text-[48px] text-ink mb-4 tracking-tight leading-none">
          Stop guessing. Start growing.
        </h2>
        <p className="relative z-10 font-sans text-body-md text-muted mb-8 max-w-lg">
          Whether it's a 10-person startup or a Fortune 500 giant, we'll map your route.
        </p>
        <Button
          variant="brand"
          onClick={handleAction}
          className="h-[52px] px-10 rounded-xl shadow-lg mb-lg"
        >
          Get My Free Roadmap
        </Button>
        <p className="font-sans text-caption text-ink/50 uppercase tracking-widest font-medium">
          Joined by 5,000+ engineers this month • Free forever
        </p>
      </div>
    </section>
  );
}

// Custom SVG Icons to replace missing lucide-react brand icons
const GitHubIcon = ({ size = 18 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
  </svg>
);

const LinkedinIcon = ({ size = 18 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect width="4" height="12" x="2" y="9" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);

const InstagramIcon = ({ size = 18 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);

export function Footer() {
  return (
    <footer className="w-full flex justify-center border-t border-brand-peach/20 bg-brand-peach/90 backdrop-blur-xl">
      <div className="max-w-[1440px] w-full px-8 py-3 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center border border-white/20">
            <span className="text-white font-display text-[14px]">N</span>
          </div>
          <span className="font-display text-[16px] font-bold text-white">SkillPath</span>
          <span className="h-4 w-px bg-white/20 hidden md:block" />
          <span className="font-sans text-[11px] text-white/50 hidden md:block">© 2026 SkillPath Inc.</span>
        </div>

        <div className="flex items-center gap-6">
          <ul className="flex gap-5">
            <li>
              <a href="https://github.com/shauryap9006-cell" target="_blank" rel="noopener noreferrer" className="text-muted hover:text-brand-pink transition-all duration-300">
                <GitHubIcon size={18} />
              </a>
            </li>
            <li>
              <a href="https://www.linkedin.com/in/shaurya-singh-971005357/" target="_blank" rel="noopener noreferrer" className="text-muted hover:text-brand-teal transition-all duration-300">
                <LinkedinIcon size={18} />
              </a>
            </li>
            <li>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="text-muted hover:text-brand-pink transition-all duration-300">
                <InstagramIcon size={18} />
              </a>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
