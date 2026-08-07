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
      <div className="flex items-center gap-1 overflow-x-auto pb-2 scrollbar-thin">
        {careerPath.map((node, i) => {
          const isCurrent = i === 0 || node.slug === currentRole;
          const isTarget = i === careerPath.length - 1 && careerPath.length > 1;
          const progressPercent = salaryRange.max > salaryRange.min
            ? ((node.baseSalary - salaryRange.min) / (salaryRange.max - salaryRange.min)) * 100
            : 100;

          return (
            <React.Fragment key={node.slug}>
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: i * 0.1 }}
                className={`relative flex-shrink-0 rounded-xl border px-4 py-3 min-w-[140px] transition-all ${
                  isTarget
                    ? 'bg-emerald-500/10 border-emerald-500/30 ring-1 ring-emerald-500/20'
                    : isCurrent
                      ? 'bg-purple-500/10 border-purple-500/30 ring-1 ring-purple-500/20'
                      : 'bg-white/[0.02] border-white/[0.08] hover:border-white/[0.12]'
                }`}
              >
                {/* Role label */}
                <p className={`text-[12px] font-semibold leading-tight ${
                  isTarget ? 'text-emerald-300' : isCurrent ? 'text-purple-300' : 'text-white/70'
                }`}>
                  {node.label}
                </p>

                {/* Salary */}
                <p className={`text-[11px] mt-1 font-mono ${
                  isTarget ? 'text-emerald-400/80' : isCurrent ? 'text-purple-400/80' : 'text-white/40'
                }`}>
                  {formatSalary(node.baseSalary)}
                </p>

                {/* Badge */}
                {isCurrent && !isTarget && (
                  <span className="absolute -top-2 left-3 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    You
                  </span>
                )}
                {isTarget && (
                  <span className="absolute -top-2 left-3 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Target
                  </span>
                )}

                {/* Progress bar */}
                <div className="mt-2 h-1 rounded-full bg-white/[0.05] overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercent}%` }}
                    transition={{ duration: 0.5, delay: i * 0.1 + 0.3 }}
                    className={`h-full rounded-full ${
                      isTarget ? 'bg-emerald-400/60' : isCurrent ? 'bg-purple-400/60' : 'bg-white/20'
                    }`}
                  />
                </div>
              </motion.div>

              {/* Arrow connector */}
              {i < careerPath.length - 1 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.2, delay: i * 0.1 + 0.2 }}
                  className="flex-shrink-0"
                >
                  <ArrowRight className="w-4 h-4 text-white/20" />
                </motion.div>
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
