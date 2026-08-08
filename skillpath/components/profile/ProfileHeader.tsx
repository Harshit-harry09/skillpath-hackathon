// components/profile/ProfileHeader.tsx
'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Pencil, Check, X, Link, CheckCheck } from 'lucide-react';
import type { UserProfile } from '@/types/profile';
import { getInitials } from '@/lib/profile-utils';
import { useAuth } from '@/context/AuthContext';

interface ProfileHeaderProps {
  profile: UserProfile;
  onUpdate: (p: UserProfile) => void;
}

export function ProfileHeader({ profile, onUpdate }: ProfileHeaderProps) {
  const { logout, getToken } = useAuth();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(profile.display_name);
  const [role, setRole] = useState(profile.target_role ?? '');
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [shareLoading, setShareLoading] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    const token = await getToken();
    const res = await fetch('/api/profile', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ display_name: name, target_role: role }),
    });
    if (res.ok) {
      onUpdate({ ...profile, display_name: name, target_role: role });
      setEditing(false);
    }
    setSaving(false);
  };

  const handleShare = async () => {
    setShareLoading(true);
    const token = await getToken();
    const res = await fetch('/api/profile/share', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    await navigator.clipboard.writeText(data.url);
    setCopied(true);
    setShareLoading(false);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="flex flex-col lg:flex-row items-center lg:items-center justify-between gap-8 pb-10 border-b border-hairline/50">
      <div className="flex flex-col md:flex-row items-center gap-8 flex-1">
        {/* Avatar - High-Fidelity Clay Style */}
        <div
          className="w-24 h-24 rounded-[36px] flex items-center justify-center text-white font-display font-bold text-3xl shrink-0 shadow-2xl relative group overflow-hidden"
          style={{
            background: `linear-gradient(135deg, ${profile.avatar_color}, ${profile.avatar_color}dd)`,
            boxShadow: `0 20px 40px -12px ${profile.avatar_color}80`,
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent opacity-50" />
          <span className="relative z-10 drop-shadow-md">
            {getInitials(profile.display_name)}
          </span>
        </div>

        {/* Identity Cluster - Fixed Alignment */}
        <div className="flex-1 min-w-0 text-center md:text-left">
          <AnimatePresence mode="wait">
            {editing ? (
              <motion.div
                key="editing"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex flex-col sm:flex-row items-center gap-4"
              >
                <input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full sm:w-auto font-display text-display-xs text-ink bg-surface-card border border-hairline rounded-2xl px-6 py-2.5 outline-none focus:border-primary shadow-sm"
                  placeholder="Name"
                />
                <input
                  value={role}
                  onChange={e => setRole(e.target.value)}
                  className="w-full sm:w-auto font-sans text-body-md text-muted bg-surface-card border border-hairline rounded-2xl px-6 py-2.5 outline-none focus:border-primary shadow-sm"
                  placeholder="Target role"
                />
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="p-3 bg-ink text-on-primary rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-lg"
                  >
                    <Check size={18} />
                  </button>
                  <button
                    onClick={() => setEditing(false)}
                    className="p-3 border border-hairline text-muted rounded-2xl hover:bg-surface-soft transition-all"
                  >
                    <X size={18} />
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="display"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                {/* Row 1: Name & Edit */}
                <div className="flex items-center justify-center md:justify-start gap-4 mb-4">
                  <h1 className="font-display text-display-sm text-ink tracking-tight capitalize">
                    {profile.display_name}
                  </h1>
                  <button
                    onClick={() => setEditing(true)}
                    className="p-2 rounded-xl text-muted/30 hover:text-ink hover:bg-surface-soft transition-all group"
                  >
                    <Pencil size={18} className="group-hover:rotate-12 transition-transform" />
                  </button>
                </div>

                {/* Row 2: Target Pill & Email (Perfectly Aligned) */}
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                  <div className="flex items-center gap-2.5 px-4 py-1.5 bg-surface-card border border-hairline rounded-full shadow-sm">
                    <span className="text-base">🎯</span>
                    <span className="font-sans text-body-sm text-ink font-bold capitalize whitespace-nowrap">
                      {profile.target_role || 'No Target Locked'}
                    </span>
                  </div>

                  {profile.email && (
                    <>
                      <div className="hidden sm:block w-1.5 h-1.5 rounded-full bg-hairline/60" />
                      <span className="font-sans text-body-sm text-muted font-medium truncate max-w-[240px]">
                        {profile.email}
                      </span>
                    </>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Action Unit */}
      <div className="flex flex-col sm:flex-row lg:flex-col items-center gap-3 shrink-0">
        <button
          onClick={handleShare}
          disabled={shareLoading}
          className={[
            'group flex items-center justify-center gap-3 px-8 py-3.5 rounded-2xl border font-sans text-[11px] font-bold uppercase tracking-[0.25em] transition-all shadow-sm hover:shadow-xl active:scale-95 min-w-[220px]',
            copied
              ? 'border-brand-teal bg-brand-teal/5 text-brand-teal'
              : 'border-hairline bg-surface-card text-muted hover:border-ink hover:text-ink',
          ].join(' ')}
        >
          {copied ? (
            <><CheckCheck size={16} /> Ready</>
          ) : (
            <><Link size={16} className="group-hover:rotate-12 transition-transform" /> {shareLoading ? 'Syncing...' : 'Share Profile'}</>
          )}
        </button>

        <button
          onClick={logout}
          className="flex items-center justify-center gap-2 px-6 py-2 text-muted/50 hover:text-brand-pink font-sans text-[9px] font-bold uppercase tracking-[0.35em] transition-all group"
        >
          <X size={12} className="group-hover:rotate-90 transition-transform" />
          Sign Out
        </button>
      </div>
    </div>
  );
}
