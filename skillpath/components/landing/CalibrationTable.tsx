import React from 'react';
import { Building2, Rocket, Target, Zap, Users, Brain, ArrowRightLeft, ShieldCheck, Microscope } from 'lucide-react';
import { motion } from 'framer-motion';

export function CalibrationTable() {
  const comparison = [
    {
      skill: "Product Direction",
      icon: <Target className="w-4 h-4" />,
      startup: "High ambiguity; you define the 'What'",
      enterprise: "Clear roadmap; you execute the 'How'",
      delta: "Autonomy vs. Alignment"
    },
    {
      skill: "Tech Stack",
      icon: <Zap className="w-4 h-4" />,
      startup: "Bleeding edge; optimized for velocity",
      enterprise: "Stable; legacy-conscious; optimized for scale",
      delta: "Speed vs. Stability"
    },
    {
      skill: "Role Scope",
      icon: <Users className="w-4 h-4" />,
      startup: "Generalist; 'Wear many hats' mentality",
      enterprise: "Specialist; Deep domain expertise required",
      delta: "Breadth vs. Depth"
    },
    {
      skill: "Decision Speed",
      icon: <Brain className="w-4 h-4" />,
      startup: "Minutes; direct communication with Founder",
      enterprise: "Weeks; involves multi-level stakeholders",
      delta: "Agility vs. Governance"
    },
    {
      skill: "Risk Tolerance",
      icon: <ShieldCheck className="w-4 h-4" />,
      startup: "Fail fast; pivot quickly to survive",
      enterprise: "Zero downtime; protect the core revenue",
      delta: "Growth vs. Preservation"
    },
    {
      skill: "Code Review",
      icon: <Microscope className="w-4 h-4" />,
      startup: "Pragmatic; shipping beats perfection",
      enterprise: "Rigorous; security and compliance first",
      delta: "Output vs. Audit"
    }
  ];

  return (
    <section className="bg-canvas py-16 md:py-32 px-4 sm:px-8 lg:px-24 flex justify-center overflow-hidden">
      <div className="max-w-[1280px] w-full">
        <div className="text-center mb-12 md:mb-20">
          <motion.span 
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-sans text-[11px] font-bold uppercase tracking-[0.3em] text-muted mb-4 block"
          >
            Company Calibration
          </motion.span>
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="font-display text-[32px] sm:text-display-md lg:text-[64px] text-ink mb-4 sm:mb-6 leading-tight"
          >
            One role. Two worlds.
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="font-sans text-[18px] text-body max-w-2xl mx-auto leading-relaxed"
          >
            We calibrate your "Software Engineer" profile differently based on where you're applying. 
            The skills that get you hired at a startup will often disqualify you from a Fortune 500.
          </motion.p>
        </div>

        <div className="relative">
          {/* Header */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-8 items-center px-6">
            <div className="hidden md:block md:col-span-3 text-[10px] font-bold text-muted uppercase tracking-widest">Dimension</div>
            <div className="md:col-span-4 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-brand-pink/10 flex items-center justify-center text-brand-pink">
                <Rocket size={16} />
              </div>
              <span className="font-display text-title-sm text-ink">Early Startup</span>
            </div>
            <div className="hidden md:flex md:col-span-1 justify-center">
              <ArrowRightLeft className="w-4 h-4 text-hairline" />
            </div>
            <div className="md:col-span-4 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-brand-pink/10 flex items-center justify-center text-brand-pink/80">
                <Building2 size={16} />
              </div>
              <span className="font-display text-title-sm text-ink">Fortune 500</span>
            </div>
          </div>

          {/* Grid Rows */}
          <div className="space-y-4">
            {comparison.map((item, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="group relative grid grid-cols-1 md:grid-cols-12 gap-4 items-center bg-surface-soft/50 border border-hairline p-6 rounded-2xl hover:bg-surface-soft hover:border-brand-pink/30 transition-all duration-300"
              >
                {/* Mobile Dimension Label */}
                <div className="md:hidden text-[9px] font-bold text-brand-pink uppercase tracking-widest mb-2">
                  {item.skill}
                </div>

                {/* Left Side: Dimension */}
                <div className="md:col-span-3 hidden md:flex items-center gap-3 border-r border-hairline/50 h-full">
                  <div className="p-2 rounded-lg bg-brand-pink/5 border border-brand-pink/10 text-brand-pink group-hover:bg-brand-pink group-hover:text-white transition-colors">
                    {item.icon}
                  </div>
                  <div>
                    <div className="font-display text-[15px] text-ink leading-none mb-1">{item.skill}</div>
                    <div className="text-[10px] font-bold text-brand-pink/60 uppercase tracking-wider">{item.delta}</div>
                  </div>
                </div>

                {/* Startup Content */}
                <div className="md:col-span-4 font-sans text-[14px] text-ink/70 leading-relaxed pl-0 md:pl-4">
                  <span className="md:hidden font-bold text-brand-pink/60 text-[10px] block mb-1">STARTUP</span>
                  {item.startup}
                </div>

                {/* Center Divider Icon */}
                <div className="hidden md:flex md:col-span-1 justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                   <div className="w-1.5 h-1.5 rounded-full bg-brand-pink/30" />
                </div>

                {/* Enterprise Content */}
                <div className="md:col-span-4 font-sans text-[14px] text-ink/70 leading-relaxed border-t border-hairline pt-4 md:border-t-0 md:pt-0">
                  <span className="md:hidden font-bold text-brand-pink/40 text-[10px] block mb-1 uppercase">Enterprise</span>
                  {item.enterprise}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Bottom Insight */}
          <motion.div 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.8 }}
            className="mt-12 p-8 rounded-2xl bg-surface-strong border border-hairline text-center"
          >
            <p className="font-sans text-[14px] text-muted leading-relaxed">
              <strong className="text-ink">The SkillPath Insight:</strong> High-growth companies value <span className="text-brand-pink font-semibold">Adaptive Velocity</span>, while established giants value <span className="text-brand-pink/70 font-semibold">Reliable Complexity</span>. We map your trajectory to the world you want to conquer.
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
