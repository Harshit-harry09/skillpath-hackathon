'use client';

import React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Dock, DockIcon } from '@/components/ui/dock';
import {
  Home,
  Compass,
  Target,
  Briefcase,
  Swords,
  History,
  User,
  Sparkles,
} from 'lucide-react';

export function FloatingDock() {
  const router = useRouter();
  const pathname = usePathname();

  const items = [
    { href: '/', label: 'Home', icon: Home, matchExact: true },
    { href: '/atlas', label: 'Atlas OS', icon: Sparkles },
    { href: '/analyze', label: 'Analyze', icon: Target },
    { href: '/explore', label: 'Explore Roles', icon: Compass },
    { href: '/battle', label: 'Skill Battle', icon: Swords },
    { href: '/jobs', label: 'Job Tracker', icon: Briefcase },
    { href: '/history', label: 'Past Analyses', icon: History },
    { href: '/profile', label: 'Profile & Growth', icon: User },
  ];

  return (
    <div className="fixed bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-[100] pointer-events-auto max-w-[96vw] px-1 sm:px-2">
      <Dock className="shadow-sm border-[#1F3A4B]/10 dark:border-white/8">
        {items.map(({ href, label, icon: Icon, matchExact }) => {
          const active = matchExact ? pathname === href : pathname.startsWith(href);

          return (
            <DockIcon
              key={href}
              onClick={() => router.push(href)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  router.push(href);
                }
              }}
              aria-label={label}
              title={label}
              role="button"
              tabIndex={0}
              className={[
                'transition-all duration-300 relative group',
                active
                  ? 'bg-brand-pink text-white border-2 border-ink shadow-md'
                  : 'text-muted hover:text-ink hover:bg-surface-soft',
              ].join(' ')}
            >
              <Icon className="w-5 h-5" />
              {/* Floating Tooltip */}
              <span className="absolute -top-10 left-1/2 -translate-x-1/2 px-2.5 py-1 rounded-md bg-ink text-on-primary font-mono text-[10px] font-bold uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-lg">
                {label}
              </span>
            </DockIcon>
          );
        })}
      </Dock>
    </div>
  );
}
