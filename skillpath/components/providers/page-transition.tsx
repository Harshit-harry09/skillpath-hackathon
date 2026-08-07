'use client';

import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import PixelCard from '@/components/ui/pixel-card';

interface PageTransitionContextType {
  triggerTransition: (targetUrl?: string) => void;
  isTransitioning: boolean;
}

const PageTransitionContext = createContext<PageTransitionContextType>({
  triggerTransition: () => {},
  isTransitioning: false,
});

export const usePageTransition = () => useContext(PageTransitionContext);

const TRANSITION_COLORS = ["#ff4d8b", "#2dd4bf", "#b8a4ed", "#ffb084", "#e8b94a"];

export function PageTransitionProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [pixelState, setPixelState] = useState<'appear' | 'disappear'>('appear');
  const [targetUrl, setTargetUrl] = useState<string | null>(null);
  const previousPathnameRef = useRef(pathname);

  // Trigger pixel transition navigation
  const triggerTransition = (url?: string) => {
    if (isTransitioning) return;
    if (!url || url === pathname) {
      if (url) router.push(url);
      return;
    }

    setTargetUrl(url);
    setIsTransitioning(true);
    setPixelState('appear');

    // Sweep in pixels, push route mid-animation, then sweep out
    setTimeout(() => {
      router.push(url);
    }, 450);
  };

  // Route change detection: when pathname changes, sweep pixels out
  useEffect(() => {
    if (previousPathnameRef.current !== pathname) {
      previousPathnameRef.current = pathname;
      if (isTransitioning) {
        setPixelState('disappear');
        const timer = setTimeout(() => {
          setIsTransitioning(false);
          setTargetUrl(null);
        }, 500);
        return () => clearTimeout(timer);
      }
    }
  }, [pathname, isTransitioning]);

  return (
    <PageTransitionContext.Provider value={{ triggerTransition, isTransitioning }}>
      {children}

      {/* Full-Screen Pixel Card Page Transition Overlay */}
      <AnimatePresence>
        {isTransitioning && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[999999] pointer-events-auto bg-black/75 backdrop-blur-md flex items-center justify-center overflow-hidden"
          >
            <div className="absolute inset-0 w-full h-full">
              <PixelCard
                colors={TRANSITION_COLORS}
                gap={10}
                pixelSize={8}
                speed={90}
                appearFrom="middle"
                transition={{ type: "tween", duration: 0.5, ease: "easeOut" }}
                backgroundColor="transparent"
                activeState={pixelState}
                className="w-full h-full"
              />
            </div>

            {/* Optional Branding Badge during transition */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="relative z-10 font-mono text-xs font-black uppercase tracking-widest px-4 py-2 bg-black/80 text-[#ff4d8b] border border-[#ff4d8b]/40 rounded-lg shadow-[0_0_20px_rgba(255,77,139,0.3)] backdrop-blur-md"
            >
              SKILLPATH • MATRIX TRANSITION
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </PageTransitionContext.Provider>
  );
}

export function PageSlideWrapper({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}