'use client';

import React from 'react';
import { Hero } from '@/components/landing/Hero';
import { LandingInputSection } from '@/components/landing/LandingInputSection';
import { HowItWorks } from '@/components/landing/HowItWorks';
import { StatsSection } from '@/components/landing/StatsSection';
import { FeaturesGrid } from '@/components/landing/FeaturesGrid';
import { InterviewLabSection } from '@/components/landing/InterviewLabSection';
import { Differentiators } from '@/components/landing/Differentiators';
import { CtaSection, Footer } from '@/components/landing/CtaSection';

export default function Home() {
  return (
    <main
      className="relative flex flex-col min-h-screen pt-[64px]"
      style={{ background: 'var(--color-canvas)' }}
    >
      <div className="relative z-10 flex flex-col w-full">
        <Hero />
        <LandingInputSection />
        <HowItWorks />
        <StatsSection />
       
        <FeaturesGrid />
        <InterviewLabSection />
        <Differentiators />
        <CtaSection />
        <Footer />
      </div>
    </main>
  );
}
