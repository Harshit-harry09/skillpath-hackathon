// Delivered by Originkit · stack: nextjs · styling: tailwind
"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { ConcentricRings } from "@/components/originkit/ui/hero-06/concentric-rings";
import { SpiralStage } from "@/components/originkit/ui/hero-06/spiral-stage";

export const Section15Hero = () => {
  const router = useRouter();

  const handleLaunchAtlas = () => {
    router.push("/atlas");
  };

  const handleAnalyzeResume = () => {
    router.push("/analyze");
  };

  return (
    <section
      aria-label="SkillPath interactive skills vortex hero"
      className="relative isolate min-h-[92vh] sm:min-h-screen w-full overflow-hidden bg-[#f8f5ee] dark:bg-[#060608] transition-colors duration-300 flex flex-col justify-center items-center"
    >
      <ConcentricRings />

      <div className="absolute inset-0 z-[2]">
        <SpiralStage
          onExplorePeople={handleLaunchAtlas}
          onViewStories={handleAnalyzeResume}
        />
      </div>
    </section>
  );
};

export default Section15Hero;
