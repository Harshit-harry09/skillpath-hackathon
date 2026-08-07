'use client';
// updated

import * as React from 'react';
import { useTheme } from 'next-themes';
import NeuralBackground from '@/components/ui/flow-field-background';
import JobTitleInput from '@/components/explore/JobTitleInput';

export default function ExplorePage() {
  const [mounted, setMounted] = React.useState(false);
  const { theme } = useTheme();
  
  React.useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted && theme === 'dark';
  const particleColor = isDark ? '#6366f1' : '#ff4d8b';
  const trailColor = isDark ? '0, 0, 0' : '255, 250, 240';

  return (
    <main className="h-screen w-screen bg-canvas text-ink selection:bg-primary/10 relative overflow-hidden font-sans flex flex-col items-center justify-center">
      {/* Background Shader */}
      <div className="absolute inset-0 z-0 opacity-40 pointer-events-none">
        <NeuralBackground 
          color={particleColor}
          trailColor={trailColor}
          trailOpacity={0.15}
          particleCount={1500}
          speed={0.7}
        />
      </div>
      
      <div className="relative z-10 w-full">
        <JobTitleInput />
      </div>
    </main>
  );
}
