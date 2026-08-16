'use client';
// updated

import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, ArrowRight } from 'lucide-react';

interface CareerNode {
  slug: string;
  label: string;
  baseSalary: number;
}

function formatSalary(salary: number): string {
  if (salary >= 1000) return `$${Math.round(salary / 1000)}k`;
  return `$${salary.toLocaleString()}`;
}

export function CareerPathGraph({
  careerPath,
  currentRole,
  className,
}: {
  careerPath?: CareerNode[];
  currentRole?: string;
  className?: string;
}) {
  if (!careerPath || careerPath.length === 0) return null;

  const salaryRange = {
    min: Math.min(...careerPath.map(n => n.baseSalary)),
    max: Math.max(...careerPath.map(n => n.baseSalary)),
  };
  const salaryJump = salaryRange.max - salaryRange.min;
  const percentJump = salaryRange.min > 0
    ? Math.round(((salaryRange.max - salaryRange.min) / salaryRange.min) * 100)
    : 0;

  return (
    <div className={`rounded-2xl border border-white/[0.06] bg-[#0D0D12]/80 backdrop-blur-sm p-5 ${className || ''}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white/90">Career Path</h3>
            <p className="text-[11px] text-white/40 mt-0.5">
              Dijkstra optimal path · {careerPath.length} roles · +{percentJump}% salary potential
            </p>
          </div>
        </div>
        {salaryJump > 0 && (
          <div className="text-right">
            <p className="text-xs text-emerald-400 font-semibold">+{formatSalary(salaryJump)}</p>
            <p className="text-[10px] text-white/30">salary potential</p>
          </div>
        )}
      </div>

      {/* Path visualization */}
      <div data-lenis-prevent className="flex items-center gap-2 overflow-x-auto overscroll-contain touch-pan-x py-2 pb-3 scrollbar-thin">
        {careerPath.map((node, i) => {
          const isCurrent = i === 0 || node.slug === currentRole;
          const isTarget = i === careerPath.length - 1 && careerPath.length > 1;
          const progressPercent = salaryRange.max > salaryRange.min
            ? ((node.baseSalary - salaryRange.min) / (salaryRange.max - salaryRange.min)) * 100
            : 100;

          return (
            <React.Fragment key={node.slug}>
              <motion.div
                initial={{ opacity: 0, scale: 0.92, y: 14 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{
                  type: 'spring',
                  stiffness: 340,
                  damping: 24,
                  delay: i * 0.12,
                }}
                whileHover={{ y: -3, scale: 1.02 }}
                className={`relative flex-shrink-0 rounded-xl border px-4 py-3 min-w-[150px] transition-all duration-150 cursor-default ${
                  isTarget
                    ? 'bg-emerald-500/10 border-emerald-500/40 shadow-[0_0_20px_rgba(16,185,129,0.15)] ring-1 ring-emerald-500/30'
                    : isCurrent
                      ? 'bg-purple-500/10 border-purple-500/40 shadow-[0_0_20px_rgba(168,85,247,0.15)] ring-1 ring-purple-500/30'
                      : 'bg-white/[0.03] border-white/[0.08] hover:border-white/[0.2] hover:bg-white/[0.05]'
                }`}
              >
                {/* Role label */}
                <p className={`text-[12px] font-bold leading-tight ${
                  isTarget ? 'text-emerald-300' : isCurrent ? 'text-purple-300' : 'text-white/80'
                }`}>
                  {node.label}
                </p>

                {/* Salary */}
                <p className={`text-[11px] mt-1.5 font-mono font-bold ${
                  isTarget ? 'text-emerald-400' : isCurrent ? 'text-purple-400' : 'text-white/40'
                }`}>
                  {formatSalary(node.baseSalary)}
                </p>

                {/* Badge */}
                {isCurrent && !isTarget && (
                  <span className="absolute -top-2 left-3 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-xs">
                    Current
                  </span>
                )}
                {isTarget && (
                  <span className="absolute -top-2 left-3 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-xs animate-pulse">
                    Target Goal
                  </span>
                )}

                {/* Progress bar */}
                <div className="mt-2.5 h-1.5 rounded-full bg-white/[0.08] overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercent}%` }}
                    transition={{ duration: 0.65, delay: i * 0.12 + 0.25, ease: [0.16, 1, 0.3, 1] }}
                    className={`h-full rounded-full ${
                      isTarget ? 'bg-emerald-400' : isCurrent ? 'bg-purple-400' : 'bg-white/30'
                    }`}
                  />
                </div>
              </motion.div>

              {/* Directional Traversal Connector */}
              {i < careerPath.length - 1 && (
                <div className="relative flex items-center justify-center w-8 shrink-0">
                  <div className="h-[2px] w-full bg-white/10 rounded-full overflow-hidden relative">
                    <motion.div
                      className="absolute inset-y-0 w-3 bg-gradient-to-r from-transparent via-emerald-400 to-transparent"
                      animate={{ x: [-12, 32] }}
                      transition={{
                        duration: 1.4,
                        repeat: Infinity,
                        delay: i * 0.35,
                        ease: 'easeInOut',
                      }}
                    />
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-white/30 absolute right-0" />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Footer note */}
      <p className="text-[10px] text-white/25 mt-3 text-center">
        Path computed via Dijkstra shortest path algorithm weighted by transition difficulty
      </p>
    </div>
  );
}
