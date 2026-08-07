'use client';
// updated

import React, { useEffect, useState, useRef } from 'react';
import { useTheme } from 'next-themes';
import { motion, AnimatePresence } from 'framer-motion';

export function ThemeTransition({ children }: { children: React.ReactNode }) {
  const { theme } = useTheme();
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [displayTheme, setDisplayTheme] = useState(theme);
  const prevTheme = useRef(theme);

  useEffect(() => {
    if (theme !== prevTheme.current) {
      setIsTransitioning(true);
      const timer = setTimeout(() => {
        setDisplayTheme(theme);
        setIsTransitioning(false);
      }, 500); // Duration of the "ink-bleed"
      prevTheme.current = theme;
      return () => clearTimeout(timer);
    }
  }, [theme]);

  return (
    <>
      {children}
      <AnimatePresence>
        {isTransitioning && (
          <motion.div
            initial={{ clipPath: 'circle(0% at 50% 50%)' }}
            animate={{ clipPath: 'circle(150% at 50% 50%)' }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 z-[9999] pointer-events-none bg-canvas"
            style={{ 
              backgroundColor: theme === 'dark' ? '#000' : '#fffaf0',
            }}
          >
            {/* Shutter effect lines */}
            <div className="absolute inset-0 flex items-center justify-center">
               <motion.div 
                 initial={{ scaleY: 0 }}
                 animate={{ scaleY: 1 }}
                 className="w-px h-full bg-brand-pink/20"
                 transition={{ duration: 0.4 }}
               />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
