'use client';

import React from 'react';
import { Hero } from '@/components/landing/Hero';
import { ExplorationEngine } from '@/components/landing/ExplorationEngine';
import { LandingInputSection } from '@/components/landing/LandingInputSection';
import { HowItWorks } from '@/components/landing/HowItWorks';
import { TimeMachineSection } from '@/components/landing/TimeMachineSection';
import { CtaSection, Footer } from '@/components/landing/CtaSection';
import { FeatureAutoSlider } from '@/components/ui/feature-auto-slider';
import { ProgressiveBlur } from '@/components/ui/progressive-blur';
import dynamic from 'next/dynamic';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';

const GenerativeArtScene = dynamic(() => import('@/components/ui/anomalous-matter-hero').then(mod => ({ default: mod.GenerativeArtScene })), { ssr: false });
const CalibrationTable = dynamic(() => import('@/components/landing/CalibrationTable').then(mod => ({ default: mod.CalibrationTable })), { ssr: false });

export default function Home() {
  const { scrollYProgress } = useScroll();

  // Orchestration transforms
  const x = useTransform(scrollYProgress, [0, 0.2, 0.4, 0.55, 0.75, 0.9, 1], ["0%", "20%", "40%", "0%", "-20%", "0%", "0%"]);
  const scale = useTransform(scrollYProgress, [0, 0.2, 0.4, 0.6, 0.8, 1], [0.8, 1.4, 1.0, 1.8, 1.2, 2.8]);
  const opacity = useTransform(scrollYProgress, [0, 0.1, 0.3, 0.4, 0.55, 0.7, 0.85, 1], [0.4, 0.9, 0.9, 0, 0, 1.0, 0.9, 0.7]); 
  const rotate = useTransform(scrollYProgress, [0, 0.4, 0.65, 0.8, 0.95], [0, 45, -45, 0, 180]);

  const springX = useSpring(x, { stiffness: 50, damping: 20 });
  const springScale = useSpring(scale, { stiffness: 50, damping: 20 });
  const springOpacity = useSpring(opacity, { stiffness: 50, damping: 20 });
  const springRotate = useSpring(rotate, { stiffness: 50, damping: 20 });

  return (
    <main className="relative flex flex-col min-h-screen bg-transparent pt-[64px]">
      {/* Global 3D Background Orchestrator */}
      <div className="fixed inset-0 pointer-events-none" style={{ zIndex: -1 }}>
        <motion.div 
          style={{ 
            x: springX, 
            scale: springScale, 
            opacity: springOpacity,
            rotate: springRotate
          }}
          className="w-full h-full"
        >
          <GenerativeArtScene />
        </motion.div>
      </div>

      {/* Floating Progressive Blur Overlay at Bottom */}
      <ProgressiveBlur
        direction="bottom"
        blurLayers={8}
        maxBlur={20}
        className="fixed bottom-0 left-0 right-0 h-28 pointer-events-none z-30"
      />

      <div className="relative z-10 flex flex-col w-full">
        <Hero />
        <LandingInputSection />
        <HowItWorks />
        <TimeMachineSection />
        <ExplorationEngine />
        <FeatureAutoSlider />
        <CalibrationTable />
        <CtaSection />
        <Footer />
      </div>
    </main>
  );
}
