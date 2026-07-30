'use client';

import React from 'react';
import { motion } from 'framer-motion';

export function NeuralSocialProof() {
  const avatars = [
    { color: '#ff4d8b', initials: 'AK' },
    { color: '#2DD4BF', initials: 'MJ' },
    { color: '#e8b94a', initials: 'SR' },
    { color: '#b8a4ed', initials: 'TL' },
  ];

  return (
    <div className="flex items-center gap-5 mt-2">
      {/* Avatar stack */}
      <div className="flex -space-x-3">
        {avatars.map((av, i) => (
          <motion.div
            key={i}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20, delay: i * 0.1 + 0.5 }}
            className="w-10 h-10 rounded-full flex items-center justify-center font-black text-[11px] text-white relative"
            style={{
              background: av.color,
              border: '3px solid var(--color-surface-card)',
              boxShadow: `2px 2px 0 var(--color-ink)`,
            }}
          >
            {av.initials}
          </motion.div>
        ))}
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.9, type: 'spring' }}
          className="w-10 h-10 rounded-full flex items-center justify-center font-black text-[10px]"
          style={{
            background: 'var(--color-surface-strong)',
            border: '3px solid var(--color-ink)',
            color: 'var(--color-ink)',
            boxShadow: '2px 2px 0 var(--color-ink)',
          }}
        >
          +2K
        </motion.div>
      </div>

      {/* Text */}
      <div className="flex flex-col">
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.0 }}
          className="font-black text-[15px] leading-tight"
          style={{ color: 'var(--color-ink)', letterSpacing: '-0.02em' }}
        >
          2,482 professionals
        </motion.p>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.1 }}
          className="font-mono text-[10px] font-black uppercase tracking-widest mt-0.5"
          style={{ color: 'var(--color-muted)' }}
        >
          mapping their growth today
        </motion.p>
      </div>
    </div>
  );
}
