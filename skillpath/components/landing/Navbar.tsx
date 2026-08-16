'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { Zap, Target } from 'lucide-react';

export function Navbar() {
  const pathname = usePathname();
  const { user, openAuthModal } = useAuth();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => { setMounted(true); }, []);

  if (pathname === '/auth') return null;

  return (
    <nav
      className="fixed top-0 left-0 right-0 h-[64px] z-[90] flex justify-center px-4 sm:px-8 lg:px-16"
      style={{
        background: 'var(--color-surface-card)',
        borderBottom: '3px solid var(--bold-border)',
        boxShadow: '0 4px 0 var(--bold-border), 0 6px 20px rgba(0,0,0,0.1)',
      }}
    >
      <div className="max-w-[1280px] w-full flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <Link href="/" aria-label="SkillPath Home Page" className="flex items-center gap-3 cursor-pointer group shrink-0">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center"
            style={{
              background: 'var(--color-ink)',
              boxShadow: '3px 3px 0 var(--color-brand-pink)',
              border: '2px solid var(--bold-border)',
            }}
          >
            <Zap className="w-5 h-5" style={{ color: 'var(--color-canvas)' }} fill="currentColor" aria-hidden="true" />
          </div>
          <span className="font-britney text-[26px] tracking-tight font-normal leading-none" style={{ color: 'var(--color-ink)' }}>
            skillpath
          </span>
        </Link>

        {/* Right side */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <ThemeToggle />
          <Link
            href="/atlas"
            className="text-[11px] sm:text-[13px] font-comico uppercase tracking-wider px-3 sm:px-4 py-2 rounded-md transition-all duration-150 active:translate-y-[2px] flex items-center gap-1.5 cursor-pointer"
            style={{
              background: 'var(--color-surface-soft)',
              color: 'var(--color-ink)',
              border: '2px solid var(--bold-border)',
              boxShadow: '2px 2px 0 var(--bold-border)',
              letterSpacing: '0.04em',
            }}
          >
            <Zap size={13} className="text-brand-pink fill-current" />
            <span>Atlas OS</span>
          </Link>
          <Link
            href="/analyze"
            className="text-[11px] sm:text-[13px] font-comico uppercase tracking-wider px-3.5 sm:px-4 py-2 rounded-md transition-all duration-150 active:translate-y-[2px] flex items-center gap-1.5 cursor-pointer"
            style={{
              background: 'var(--color-brand-pink)',
              color: '#fff',
              border: '2px solid var(--bold-border)',
              boxShadow: '2px 2px 0 var(--bold-border)',
              letterSpacing: '0.04em',
            }}
          >
            <Target size={13} />
            <span>Analyze</span>
          </Link>
        </div>
      </div>
    </nav>
  );
}
