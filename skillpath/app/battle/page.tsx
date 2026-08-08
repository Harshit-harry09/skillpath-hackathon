'use client';

import * as React from 'react';
import { useTheme } from 'next-themes';
import NeuralBackground from '@/components/ui/flow-field-background';
import { SkillBattle } from '@/components/explore/SkillBattle';

export default function BattlePage() {
  const [mounted, setMounted] = React.useState(false);
  const { theme } = useTheme();
  
  React.useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted && theme === 'dark';
  const particleColor = isDark ? '#6366f1' : '#ff4d8b';
  const trailColor = isDark ? '0, 0, 0' : '255, 250, 240';

  return (
    <main className="min-h-screen w-full bg-canvas text-ink selection:bg-primary/10 relative font-sans flex flex-col items-center justify-center pt-24 pb-28 overflow-hidden">
      {/* Background Shader */}
      <div className="fixed inset-0 z-0 opacity-40 pointer-events-none">
        <NeuralBackground 
          color={particleColor}
          trailColor={trailColor}
          trailOpacity={0.15}
          particleCount={1200}
          speed={0.6}
        />
      </div>
      
      {/* Content Container */}
      <div className="relative z-10 w-full max-w-4xl px-4">
        <SkillBattle />
      </div>
    </main>
  );
}
