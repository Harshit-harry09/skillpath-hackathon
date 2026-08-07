'use client';
// updated

import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, FileText, CheckCircle2, Zap } from 'lucide-react';

interface ResumeTransitionOverlayProps {
  isVisible: boolean;
  onTransitionComplete?: () => void;
}

export function ResumeTransitionOverlay({
  isVisible,
  onTransitionComplete,
}: ResumeTransitionOverlayProps) {
  const hasTriggeredRef = useRef(false);

  useEffect(() => {
    if (isVisible && !hasTriggeredRef.current) {
      hasTriggeredRef.current = true;
      const timer = setTimeout(() => {
        if (onTransitionComplete) {
          onTransitionComplete();
        }
      }, 1300);
      return () => clearTimeout(timer);
    } else if (!isVisible) {
      hasTriggeredRef.current = false;
    }
  }, [isVisible, onTransitionComplete]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-[99999] pointer-events-auto bg-black/80 backdrop-blur-lg flex items-center justify-center overflow-hidden"
          style={{ perspective: 1200 }}
        >
          {/* Background Warp Aura */}
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 3, opacity: 0.4 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            className="absolute w-[600px] h-[600px] rounded-full bg-gradient-to-r from-brand-pink via-purple-600 to-brand-teal blur-3xl pointer-events-none"
          />

          {/* Floating Particle Lines */}
          <div className="absolute inset-0 pointer-events-none opacity-30">
            {Array.from({ length: 12 }).map((_, i) => (
              <motion.div
                key={i}
                initial={{ y: "100vh", opacity: 0 }}
                animate={{ y: "-20vh", opacity: [0, 1, 0] }}
                transition={{
                  duration: 1.2 + (i % 4) * 0.2,
                  repeat: Infinity,
                  delay: i * 0.08,
                  ease: "linear",
                }}
                className="absolute w-[2px] h-20 bg-gradient-to-b from-brand-pink to-transparent"
                style={{ left: `${(i + 1) * 8}%` }}
              />
            ))}
          </div>

          {/* 3D Flying Resume Document Card */}
          <motion.div
            initial={{
              scale: 0.4,
              rotateX: 45,
              rotateY: -35,
              rotateZ: -10,
              y: 120,
              z: -400,
              opacity: 0,
            }}
            animate={{
              scale: [0.4, 1.1, 3.8],
              rotateX: [45, 10, 0],
              rotateY: [-35, 15, 0],
              rotateZ: [-10, 5, 0],
              y: [120, -20, -100],
              z: [-400, 100, 800],
              opacity: [0, 1, 1, 0],
            }}
            transition={{
              duration: 1.3,
              times: [0, 0.4, 1],
              ease: [0.16, 1, 0.3, 1],
            }}
            className="w-[380px] h-[520px] rounded-2xl bg-canvas border-4 border-bold-border p-6 shadow-[0_25px_60px_rgba(0,0,0,0.5),0_0_40px_rgba(255,77,139,0.3)] relative overflow-hidden flex flex-col justify-between"
            style={{ transformStyle: 'preserve-3d' }}
          >
            {/* Holographic Header Bar */}
            <div>
              <div className="flex items-center justify-between border-b-2 border-hairline pb-4 mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-brand-pink text-white flex items-center justify-center font-bold">
                    <FileText size={18} />
                  </div>
                  <div>
                    <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-brand-pink block">
                      VECTOR PROCESSING
                    </span>
                    <h3 className="font-black text-sm uppercase text-ink">RESUME MATRIX DEPLOYED</h3>
                  </div>
                </div>
                <Zap className="w-5 h-5 text-brand-teal animate-bounce" />
              </div>

              {/* Mock Resume Lines */}
              <div className="space-y-3">
                <div className="h-4 bg-brand-pink/20 rounded w-3/4 animate-pulse" />
                <div className="h-3 bg-ink/10 rounded w-full" />
                <div className="h-3 bg-ink/10 rounded w-5/6" />

                {/* Skill Chips */}
                <div className="flex flex-wrap gap-2 py-3">
                  {['React', 'System Architecture', 'AI Engineering', 'Node.js'].map((s, idx) => (
                    <span key={idx} className="font-mono text-[10px] font-bold px-2 py-1 bg-brand-teal/15 text-brand-teal border border-brand-teal/30 rounded">
                      {s}
                    </span>
                  ))}
                </div>

                <div className="h-3 bg-ink/10 rounded w-11/12" />
                <div className="h-3 bg-ink/10 rounded w-2/3" />
              </div>
            </div>

            {/* Floating Stamp Banner */}
            <div className="mt-auto pt-4 border-t-2 border-dashed border-brand-pink/40 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-brand-pink">
                <Sparkles size={14} />
                <span>MAPPING DELTA VECTOR...</span>
              </div>
              <CheckCircle2 size={16} className="text-brand-teal" />
            </div>
          </motion.div>

          {/* Flash Reveal Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0, 0, 1] }}
            transition={{ duration: 1.3, times: [0, 0.7, 0.9, 1] }}
            className="fixed inset-0 bg-canvas pointer-events-none z-[100000]"
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
