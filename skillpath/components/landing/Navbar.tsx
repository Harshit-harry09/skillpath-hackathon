'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { MarketToggle } from '@/components/ui/MarketToggle';
import { Zap } from 'lucide-react';

export function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, openAuthModal } = useAuth();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => { setMounted(true); }, []);

  if (pathname === '/auth') return null;

  return (
    <nav
      className="fixed top-0 left-0 right-0 h-[64px] z-[90] flex justify-center px-4 sm:px-8 lg:px-24"
      style={{
        background: 'var(--color-surface-card)',
        borderBottom: '3px solid var(--bold-border)',
        boxShadow: '0 4px 0 var(--bold-border), 0 6px 20px rgba(0,0,0,0.1)',
      }}
    >
      <div className="max-w-[1280px] w-full flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" aria-label="SkillPath Home Page" className="flex items-center gap-3 cursor-pointer group focus-visible:ring-2 focus-visible:ring-brand-pink focus-visible:outline-none rounded-lg">
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
          <span className="font-black text-[20px] tracking-tight" style={{ color: 'var(--color-ink)', letterSpacing: '-0.03em' }}>
            Skill<span style={{ color: 'var(--color-brand-pink)' }}>Path</span>
          </span>
        </Link>

        {/* Center nav links */}
        <div className="hidden md:flex items-center gap-1">
          {['Features', 'How It Works', 'Explore'].map((label, i) => (
            <button
              key={label}
              aria-label={`Scroll to ${label} section`}
              onClick={() => {
                const ids = ['features', 'how-it-works', 'explore'];
                document.getElementById(ids[i])?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="px-4 py-2 text-[13px] font-bold uppercase tracking-wider text-muted hover:text-ink hover:bg-surface-strong transition-all duration-150 rounded-md focus-visible:ring-2 focus-visible:ring-brand-pink focus-visible:outline-none"
              style={{ letterSpacing: '0.06em' }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          <MarketToggle />
          <ThemeToggle />
          {mounted && (!user ? (
            <>
              <button onClick={openAuthModal} className="text-[13px] font-bold uppercase tracking-wider px-3 py-1.5 transition-colors" style={{ color: 'var(--color-muted)' }}>
                Sign in
              </button>
              <button
                onClick={openAuthModal}
                className="text-[13px] font-black uppercase tracking-wider px-5 py-2 rounded-md transition-all duration-150 active:translate-y-[2px]"
                style={{
                  background: 'var(--color-brand-pink)',
                  color: '#fff',
                  border: '2px solid var(--bold-border)',
                  boxShadow: '3px 3px 0 var(--bold-border)',
                  letterSpacing: '0.06em',
                }}
              >
                Try Free
              </button>
            </>
          ) : (
            <button
              onClick={() => router.push('/profile')}
              className="text-[13px] font-black uppercase tracking-wider px-5 py-2 rounded-md transition-all duration-150 active:translate-y-[2px]"
              style={{
                background: 'var(--color-brand-pink)',
                color: '#fff',
                border: '2px solid var(--bold-border)',
                boxShadow: '3px 3px 0 var(--bold-border)',
                letterSpacing: '0.06em',
              }}
            >
              Profile
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
}
