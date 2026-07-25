'use client';

import React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Dock, DockIcon } from '@/components/ui/dock';
import {
  Home,
  Swords,
  Compass,
  Target,
  Hourglass,
  History,
  User
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export function FloatingDock() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, openAuthModal } = useAuth();

  if (pathname === '/auth') return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] pointer-events-auto">
      <Dock>
        <DockIcon
          onClick={() => router.push('/')}
          className={pathname === '/' ? 'bg-brand-pink/20 text-brand-pink border border-brand-pink/40' : ''}
        >
          <Home className="w-5 h-5" />
        </DockIcon>

        <DockIcon
          onClick={() => router.push('/battle')}
          className={pathname === '/battle' ? 'bg-brand-pink/20 text-brand-pink border border-brand-pink/40' : ''}
        >
          <Swords className="w-5 h-5" />
        </DockIcon>

        <DockIcon
          onClick={() => router.push('/explore')}
          className={pathname === '/explore' ? 'bg-brand-pink/20 text-brand-pink border border-brand-pink/40' : ''}
        >
          <Compass className="w-5 h-5" />
        </DockIcon>

        <DockIcon
          onClick={() => router.push('/analyze')}
          className={pathname === '/analyze' ? 'bg-brand-pink/20 text-brand-pink border border-brand-pink/40' : ''}
        >
          <Target className="w-5 h-5" />
        </DockIcon>

        <DockIcon
          onClick={() => router.push('/time-machine')}
          className={pathname === '/time-machine' ? 'bg-amber-400/20 text-amber-500 border border-amber-400/40' : ''}
        >
          <Hourglass className="w-5 h-5 text-amber-400 animate-pulse" />
        </DockIcon>

        <DockIcon
          onClick={() => router.push('/history')}
          className={pathname === '/history' ? 'bg-brand-pink/20 text-brand-pink border border-brand-pink/40' : ''}
        >
          <History className="w-5 h-5" />
        </DockIcon>

        <DockIcon
          onClick={() => {
            if (user) router.push('/profile');
            else openAuthModal();
          }}
          className={pathname === '/profile' ? 'bg-brand-pink/20 text-brand-pink border border-brand-pink/40' : ''}
        >
          <User className="w-5 h-5" />
        </DockIcon>
      </Dock>
    </div>
  );
}
