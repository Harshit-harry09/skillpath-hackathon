'use client';

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useUI } from "@/context/UIContext";
import { usePathname } from "next/navigation";

const MOTIVATIONAL_LINES = [
  "Forging new neural connections…",
  "Sharpening your cognitive edge…",
  "Calibrating synaptic pathways…",
  "Loading brilliance, one byte at a time…",
  "Preparing your mental gymnasium…",
  "Assembling the building blocks of mastery…",
  "Dusting off the compendium of knowledge…",
  "Brewing a fresh pot of intellect…",
  "Synchronizing ambitions with actions…",
  "Unlocking the potential vault…",
  "Structuring concepts for maximal impact…",
  "Waking up the dormant brain cells…",
  "Synthesizing your next big breakthrough…",
  "Aligning theory with practice…",
  "Curating an elite curriculum for you…",
  "Polishing the stepping stones to success…",
  "Gathering the raw materials of genius…",
  "Fine-tuning your learning trajectory…",
  "Igniting the spark of curiosity…",
  "Preparing the canvas for your next masterpiece…"
];

interface PreloaderProps {
  onComplete?: () => void;
}

export function Preloader({ onComplete }: PreloaderProps) {
  const pathname = usePathname();
  const { setLoaded } = useUI();
  const [progress, setProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [quote, setQuote] = useState("");
  const [hasMounted, setHasMounted] = useState(false);

  // Only show preloader on the home page
  const isHomePage = pathname === "/";

  useEffect(() => {
    setHasMounted(true);

    // If not on home page, set loaded immediately and don't show preloader
    if (!isHomePage) {
      setLoaded(true);
      return;
    }

    setQuote(MOTIVATIONAL_LINES[Math.floor(Math.random() * MOTIVATIONAL_LINES.length)]);

    const handleLoad = () => {
      setProgress(100);
      setIsVisible(false);
      setLoaded(true);
      if (onComplete) onComplete();
    };

    if (document.readyState === 'complete' || document.readyState === 'interactive') {
      handleLoad();
    } else {
      window.addEventListener('DOMContentLoaded', handleLoad);
      const fallback = setTimeout(handleLoad, 300);

      return () => {
        window.removeEventListener('DOMContentLoaded', handleLoad);
        clearTimeout(fallback);
      };
    }
  }, [setLoaded, onComplete, isHomePage]);

  if (!hasMounted || !isHomePage) return null;

  return (
    <AnimatePresence mode="wait">
      {isVisible && (
        <motion.div
          key="preloader-overlay"
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-canvas p-8 text-ink overflow-hidden"
          initial={{ opacity: 1 }}
          exit={{
            y: "-100%",
            transition: {
              duration: 1.2,
              ease: [0.76, 0, 0.24, 1],
              when: "afterChildren"
            }
          }}
        >
          {/* Noise Texture — inline SVG to avoid external network request */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E\")", backgroundRepeat: 'repeat', backgroundSize: '128px 128px' }} />

          <motion.div
            key="preloader-content"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{
              opacity: 0,
              scale: 1.05,
              transition: { duration: 0.5, ease: "easeIn" }
            }}
            className="flex flex-col items-center w-full max-w-2xl"
          >
            <div className="relative flex flex-col items-center justify-center mb-20">
              <div className="relative w-40 h-40">
                <motion.div
                  className="absolute inset-0 border-4 border-ink/5 rounded-[40px]"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                />
                <motion.div
                  className="absolute inset-0 border-t-4 border-brand-pink rounded-[40px]"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                />
                <div className="absolute inset-4 bg-white rounded-[32px] shadow-2xl flex items-center justify-center">
                  <div className="w-12 h-12 bg-ink rounded-lg flex items-center justify-center">
                    <div className="w-6 h-6 bg-brand-pink rounded-sm rotate-45" />
                  </div>
                </div>
              </div>
            </div>

            <div className="text-center space-y-6 max-w-md">
              <motion.span
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="text-[10px] font-black uppercase tracking-[0.4em] text-brand-pink"
              >
                Initializing Engine
              </motion.span>
              <p className="text-4xl font-black text-ink leading-tight tracking-tight">{quote}</p>
            </div>

            <div className="mt-20 w-full max-w-sm">
              <div className="relative h-[2px] w-full bg-ink/5 rounded-full overflow-hidden">
                <motion.div
                  className="absolute inset-y-0 left-0 bg-ink"
                  initial={{ width: "0%" }}
                  animate={{ width: `${progress}%` }}
                  transition={{ ease: "easeOut" }}
                />
              </div>
              <div className="flex justify-between mt-4">
                <span className="text-[10px] font-black uppercase tracking-widest text-muted">Progress</span>
                <span className="text-[10px] font-black uppercase tracking-widest text-ink">{Math.min(progress, 100)}%</span>
              </div>
            </div>
          </motion.div>

          {/* Background dot-grid */}
          <div className="absolute inset-0 pointer-events-none opacity-[0.03] dot-grid" />
        </motion.div>
      )}
    </AnimatePresence>
  );

}
