'use client';

import * as React from 'react';
import { useTheme } from 'next-themes';
import FaultyTerminal from '@/components/ui/FaultyTerminal';
import { SkillBattle } from '@/components/explore/SkillBattle';

export default function BattlePage() {
  const [mounted, setMounted] = React.useState(false);
  const { theme } = useTheme();
  
  React.useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted && theme === 'dark';
  const tintColor = isDark ? '#9da69c' : '#64748b';

  return (
    <main className="min-h-screen w-full bg-canvas text-ink selection:bg-primary/10 relative font-sans flex flex-col items-center justify-center pt-20 pb-28 overflow-hidden">
      {/* Faulty Terminal WebGL Background - Light mode blend mode keeps page bright */}
      <div className="fixed inset-0 z-0 opacity-40 mix-blend-multiply dark:mix-blend-normal pointer-events-none">
        <FaultyTerminal
          scale={3}
          gridMul={[2, 1]}
          digitSize={0.5}
          timeScale={0.8}
          pause={false}
          scanlineIntensity={0}
          glitchAmount={1}
          flickerAmount={1}
          noiseAmp={1}
          chromaticAberration={0}
          dither={0}
          curvature={0.35}
          tint={tintColor}
          mouseReact={false}
          mouseStrength={0}
          pageLoadAnimation={false}
          brightness={isDark ? 0.75 : 0.65}
        />
      </div>
      
      {/* Content Container */}
      <div className="relative z-10 w-full max-w-4xl px-4">
        <SkillBattle />
      </div>

      {/* Theme-safe subtle vignette overlay */}
      <div className="fixed inset-0 z-[1] bg-gradient-to-b from-canvas/10 via-transparent to-canvas/40 pointer-events-none" />
    </main>
  );
}
