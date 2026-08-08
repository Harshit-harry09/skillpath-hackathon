'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Shield, User, UserCheck, Stethoscope, Search, FileCheck, Layers } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { AppRole } from '@/types/active-job';

export interface RoleFilterTabsProps {
  selectedRole: AppRole | 'all';
  onSelectRole: (role: AppRole | 'all') => void;
  counts: Record<AppRole | 'all', number>;
}

const ROLES_CONFIG: { id: AppRole | 'all'; label: string; icon: LucideIcon; color: string }[] = [
  { id: 'all', label: 'All Roles', icon: Layers, color: 'text-muted' },
  { id: 'user', label: 'User', icon: User, color: 'text-brand-pink' },
  { id: 'admin', label: 'Admin', icon: UserCheck, color: 'text-primary' },
  { id: 'authority', label: 'Authority', icon: Shield, color: 'text-brand-purple' },
  { id: 'hospital', label: 'Hospital', icon: Stethoscope, color: 'text-brand-teal' },
  { id: 'investigator', label: 'Investigator', icon: Search, color: 'text-brand-ochre' },
  { id: 'reviewer', label: 'Reviewer', icon: FileCheck, color: 'text-emerald-500' },
];

export function RoleFilterTabs({ selectedRole, onSelectRole, counts }: RoleFilterTabsProps) {
  return (
    <div className="w-full space-y-3">
      <div className="flex items-center justify-between">
        <span className="font-sans text-[10px] font-bold uppercase tracking-[0.2em] text-muted">
          Role-Aware Perspective
        </span>
        <span className="font-mono text-[11px] text-muted font-semibold">
          {counts[selectedRole] ?? 0} {counts[selectedRole] === 1 ? 'item' : 'items'}
        </span>
      </div>

      <div className="flex flex-nowrap items-center gap-2 overflow-x-auto pb-2 pt-1 no-scrollbar">
        {ROLES_CONFIG.map(({ id, label, icon: Icon, color }) => {
          const active = selectedRole === id;
          const count = counts[id] ?? 0;

          return (
            <button
              key={id}
              onClick={() => onSelectRole(id)}
              className={[
                'relative flex items-center gap-2 px-4 py-2.5 rounded-2xl font-sans text-xs font-semibold transition-all duration-300 shrink-0 border cursor-pointer select-none',
                active
                  ? 'bg-ink text-on-primary border-ink shadow-md scale-[1.02]'
                  : 'bg-surface-card border-hairline text-muted hover:border-ink/40 hover:text-ink',
              ].join(' ')}
            >
              <Icon size={14} className={active ? 'text-on-primary' : color} />
              <span>{label}</span>
              <span
                className={[
                  'font-mono text-[10px] px-2 py-0.5 rounded-full font-bold transition-colors',
                  active
                    ? 'bg-white/20 text-on-primary'
                    : 'bg-surface-soft text-muted border border-hairline',
                ].join(' ')}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
