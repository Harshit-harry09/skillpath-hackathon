'use client';
// updated

import React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Dock, DockIcon } from '@/components/ui/dock';
import {
  Home,
  Compass,
  Target,
  Briefcase
} from 'lucide-react';

export function FloatingDock() {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <div className="fixed bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-[100] pointer-events-auto max-w-[96vw] px-1 sm:px-2">
      <Dock>
        <DockIcon
          onClick={() => router.push('/')}
          aria-label="Home"
          role="button"
          tabIndex={0}
          className={pathname === '/' ? 'bg-brand-pink/20 text-brand-pink border border-brand-pink/40' : ''}
        >
          <Home className="w-5 h-5" />
        </DockIcon>

        <DockIcon
          onClick={() => router.push('/analyze')}
          aria-label="Analyze Resume and Skills"
          role="button"
          tabIndex={0}
          className={pathname === '/analyze' ? 'bg-brand-pink/20 text-brand-pink border border-brand-pink/40' : ''}
        >
          <Target className="w-5 h-5" />
        </DockIcon>

        <DockIcon
          onClick={() => router.push('/explore')}
          aria-label="Explore Roles"
          role="button"
          tabIndex={0}
          className={pathname.startsWith('/explore') ? 'bg-brand-pink/20 text-brand-pink border border-brand-pink/40' : ''}
        >
          <Compass className="w-5 h-5" />
        </DockIcon>

        <DockIcon
          onClick={() => router.push('/jobs')}
          aria-label="Live Job Tracker"
          role="button"
          tabIndex={0}
          className={pathname.startsWith('/jobs') ? 'bg-brand-pink/20 text-brand-pink border border-brand-pink/40' : ''}
        >
          <Briefcase className="w-5 h-5" />
        </DockIcon>
      </Dock>
    </div>
  );
}
