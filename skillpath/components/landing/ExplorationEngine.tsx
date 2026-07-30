'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight, Map, Compass, Target } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useRouter } from 'next/navigation';

import { useTheme } from 'next-themes';
import NeuralBackground from '@/components/ui/flow-field-background';


export function ExplorationEngine() {
  const router = useRouter();
  const { theme } = useTheme();

  const handleExplore = () => {
    router.push('/explore');
  };

  // Determine colors based on theme
  const isDark = theme === 'dark';
  const particleColor = isDark ? '#6366f1' : '#ff4d8b'; // Indigo in dark, Pink in light
  const trailColor = isDark ? '0, 0, 0' : '255, 250, 240'; // Black in dark, Cream in light


  const featureHighlights = [
    {
      icon: <Compass className="w-5 h-5 text-brand-teal" />,
      title: "Market Discovery",
      desc: "Analyze 30+ tech trajectories to see exactly what top-tier companies are demanding right now."
    },
    {
      icon: <Map className="w-5 h-5 text-brand-pink" />,
      title: "Skill Mapping",
      desc: "Visualize the precise skill delta between roles, uncovering exactly what you need to learn to cross the gap."
    },
    {
      icon: <Target className="w-5 h-5 text-brand-ochre" />,
      title: "Company Calibration",
      desc: "Decode hiring patterns across different company stages, from fast-paced startups to enterprise giants."
    }
  ];

  return (
    <section id="exploration" className="relative bg-transparent py-12 md:py-section px-4 sm:px-8 flex justify-center border-t border-hairline overflow-hidden">
      {/* Dynamic Background Shader */}
      <div className="absolute inset-0 z-0 opacity-40 pointer-events-none">
        <NeuralBackground 
          color={particleColor}
          trailColor={trailColor}
          trailOpacity={0.12}
          particleCount={1500}
          speed={0.6}

        />
      </div>


      <div className="max-w-[1280px] w-full grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-20 items-center relative z-10">

        {/* Left Side: Explanation */}
        <div className="flex flex-col items-start text-left">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-hairline bg-surface-soft text-[10px] font-black uppercase tracking-widest text-muted mb-6 sm:mb-8"
          >
            <Sparkles className="w-3 h-3 text-brand-pink" />
            AI Exploration Engine
          </motion.div>

          <motion.h2 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 1, ease: [0.16, 1, 0.3, 1] }}
            viewport={{ once: true }}
            className="font-display text-[32px] sm:text-[48px] lg:text-[64px] text-ink leading-[1.05] tracking-tight mb-6 sm:mb-8"
          >
            Uncover the exact <br className="hidden sm:inline" />
            <span className="italic font-serif text-brand-teal">blueprint for any role.</span>
          </motion.h2>

          <motion.p 
            initial={{ opacity: 1, y: 0 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-sans text-base sm:text-[20px] text-muted max-w-xl leading-relaxed mb-8 sm:mb-12"
          >
            Reverse-engineer the job market. Browse 30+ career paths to discover the exact skills, tech stacks, and benchmarks top-tier companies demand—empowering you to level up proactively.
          </motion.p>

          <Button 
            variant="primary"
            onClick={handleExplore}
            className="w-full sm:w-auto h-[52px] sm:h-[56px] px-8 rounded-xl gap-3 shadow-lg"
          >
            Explore Career Paths
            <ArrowRight className="w-5 h-5" />
          </Button>
        </div>

        {/* Right Side: Feature Highlights */}
        <div className="grid grid-cols-1 gap-4 sm:gap-6">
          {featureHighlights.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 + 0.3, duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
              viewport={{ once: true }}
              className="p-5 sm:p-lg rounded-2xl sm:rounded-[24px] bg-white/40 dark:bg-black/20 backdrop-blur-md border border-white/20 dark:border-white/5 flex items-start gap-4 sm:gap-6 tactile-card group overflow-hidden"
            >

              <div className="w-12 h-12 rounded-lg bg-canvas flex items-center justify-center shadow-sm border border-hairline flex-shrink-0">
                {feature.icon}
              </div>
              <div>
                <h3 className="font-display text-title-sm text-ink mb-2">{feature.title}</h3>
                <p className="font-sans text-body-sm text-muted leading-relaxed">{feature.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
