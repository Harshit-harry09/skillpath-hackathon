import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, ArrowRight, DollarSign, Target, Sparkles, CheckCircle2, ChevronRight, MapPin } from 'lucide-react';
import { useUI } from '@/context/UIContext';

interface CareerCompassProps {
  trajectory: {
    current_level: string;
    current_role_label: string;
    next_role_label: string | null;
    salary_jump: number;
    delta_skills: string[];
    current_salary: number;
    next_salary: number;
    currency?: string;
    unit?: string;
    top_locations?: string[];
    full_path: Array<{
      level: string;
      label: string;
      salary: number;
      currency?: string;
      unit?: string;
      skills: string[];
    }>;
  } | null;
  gaps: any[];
}

export function CareerCompass({ trajectory, gaps }: CareerCompassProps) {
  const { market } = useUI();
  if (!trajectory || !trajectory.full_path || trajectory.full_path.length === 0) return null;

  const isIndia = market === 'india' || trajectory.currency === 'INR';
  const { full_path, current_level } = trajectory;

  // Calculate overall progress towards the NEXT milestone
  const masteredGapsCount = gaps.filter(g => g.mastered || g.completed).length;
  const totalGapsCount = gaps.length;
  const gapProgress = totalGapsCount > 0 ? (masteredGapsCount / totalGapsCount) * 100 : 100;

  // Determine current position on the 3-tier scale
  const currentIdx = full_path.findIndex(p => p.level === current_level);
  
  // Total mastery bonus
  const masteryBonus = gaps.reduce((sum, gap) => sum + (gap.premium || 0), 0);
  const bonusDisplay = isIndia ? `+₹${Math.round(masteryBonus / 100000)} LPA` : `+$${Math.round(masteryBonus / 1000)}k`;

  const formatSalary = (val: number) => {
    if (isIndia) {
      const lpa = val > 1000 ? (val / 100000).toFixed(1) : val;
      return `₹${lpa} LPA`;
    }
    return `$${Math.round(val / 1000)}k`;
  };

  const locations = trajectory.top_locations || ["Bengaluru", "Hyderabad", "Pune", "Gurugram", "Noida"];

  return (
    <div className="w-full bg-surface-card border border-hairline rounded-[2.5rem] overflow-hidden shadow-xl shadow-ink/5 mb-12">
      {/* Header */}
      <div className="p-8 border-b border-hairline bg-surface-soft/50">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
              <TrendingUp size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display text-title-md text-ink uppercase tracking-wider">
                  Professional Trajectory
                </h2>
                <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                  {isIndia ? '🇮🇳 India Market' : '🌐 Global Market'}
                </span>
              </div>
              <p className="font-sans text-body-sm text-muted">
                Career lifecycle mapping & financial benchmarks ({isIndia ? '₹ LPA' : '$ USD'})
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 px-5 py-2.5 rounded-2xl bg-brand-teal/5 border border-brand-teal/10">
            <Sparkles size={14} className="text-brand-teal" />
            <span className="text-[11px] font-bold text-brand-teal uppercase tracking-widest">
              Live Readiness: {Math.round(gapProgress)}%
            </span>
          </div>
        </div>
      </div>

      <div className="p-10">
        {/* The 3-Tier Scale */}
        <div className="relative mb-20 px-4">
          {/* Connector Line */}
          <div className="absolute top-1/2 left-0 w-full h-1 bg-hairline/50 -translate-y-1/2" />
          
          {/* Active Progress Line */}
          {currentIdx < full_path.length - 1 && (
             <motion.div 
                className="absolute top-1/2 h-1 bg-primary -translate-y-1/2 z-10"
                style={{ 
                  left: `${(currentIdx / (full_path.length - 1)) * 100}%`,
                  width: `${(1 / (full_path.length - 1)) * (gapProgress / 100) * 100}%` 
                }}
             />
          )}

          <div className="relative z-20 flex justify-between items-center">
            {full_path.map((path, i) => {
              const isPast = i < currentIdx;
              const isCurrent = i === currentIdx;
              const isFuture = i > currentIdx;

              return (
                <div key={path.level} className="flex flex-col items-center group">
                  {/* Node */}
                  <div className={`
                    w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500
                    ${isPast ? 'bg-brand-teal text-on-primary scale-90' : ''}
                    ${isCurrent ? 'bg-primary text-on-primary ring-8 ring-primary/10 scale-110 shadow-lg' : ''}
                    ${isFuture ? 'bg-surface-card border-2 border-hairline text-muted' : ''}
                  `}>
                    {isPast ? <CheckCircle2 size={18} /> : 
                     isCurrent ? <Target size={18} /> : 
                     <span className="text-[10px] font-black">{i + 1}</span>}
                  </div>

                  {/* Label */}
                  <div className={`
                    absolute top-14 flex flex-col items-center transition-opacity duration-300
                    ${isCurrent ? 'opacity-100' : 'opacity-40 group-hover:opacity-100'}
                  `}>
                    <span className="text-[10px] font-bold uppercase tracking-tighter whitespace-nowrap mb-1">
                      {path.label}
                    </span>
                    <span className="font-mono text-[11px] font-bold text-muted">
                      {formatSalary(path.salary)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Actionable Insights */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 pt-8 border-t border-hairline/50">
          {/* Next Level Focus */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <ChevronRight size={18} className="text-primary" />
                <h3 className="font-display text-nav-link text-ink uppercase tracking-widest">
                  Target: {trajectory.next_role_label || 'Executive Excellence'}
                </h3>
              </div>
            </div>
            
            <div className="space-y-4 mb-6">
              {trajectory.delta_skills.map((skill, i) => (
                <div key={skill} className="flex items-center justify-between p-4 rounded-2xl bg-surface-soft/30 border border-hairline/50 hover:border-primary/20 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-lg bg-ink text-on-primary flex items-center justify-center text-[10px] font-bold">
                      {i + 1}
                    </div>
                    <span className="font-sans text-body-sm font-semibold text-ink">{skill}</span>
                  </div>
                  {gaps.find(g => g.skill === skill)?.mastered && (
                    <CheckCircle2 size={16} className="text-brand-teal" />
                  )}
                </div>
              ))}
            </div>

            {/* Location Hotspots Badge */}
            {locations.length > 0 && (
              <div className="p-4 rounded-2xl bg-surface-soft/40 border border-hairline flex items-center gap-3">
                <MapPin size={16} className="text-primary shrink-0" />
                <div className="flex flex-wrap items-center gap-1.5 text-xs font-medium text-ink">
                  <span className="text-muted font-bold">Top Job Hubs:</span>
                  {locations.slice(0, 4).map(loc => (
                    <span key={loc} className="px-2 py-0.5 rounded bg-canvas border border-hairline text-[11px] font-semibold">
                      {loc.split(',')[0]}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Value Stats */}
          <div className="space-y-6">
             <div className="p-6 rounded-[2rem] bg-ink text-on-primary shadow-xl shadow-ink/10 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-700" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-on-primary/60 block mb-2">Estimated Growth Impact</span>
                <div className="flex items-end gap-2 mb-4">
                  <span className="font-mono text-title-lg font-black tracking-tighter">
                    +{isIndia 
                      ? (trajectory.salary_jump > 1000 ? `₹${(trajectory.salary_jump / 100000).toFixed(1)} LPA` : `₹${trajectory.salary_jump} LPA`)
                      : `$${trajectory.salary_jump.toLocaleString()}`
                    }
                  </span>
                  <span className="text-body-sm text-on-primary/60 mb-2">{isIndia ? 'promotional jump' : '/yr jump'}</span>
                </div>
                <p className="text-[11px] leading-relaxed text-on-primary/70 italic">
                  * Projected {isIndia ? 'LPA' : 'annual'} increase upon transitioning to the next seniority tier based on trained market data.
                </p>
             </div>

             <div className="p-6 rounded-[2rem] bg-brand-lavender/5 border border-brand-lavender/10">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-xl bg-brand-lavender/10 flex items-center justify-center text-brand-lavender">
                    <Sparkles size={16} />
                  </div>
                  <span className="text-[11px] font-bold text-brand-lavender uppercase tracking-widest">Mastery Multiplier</span>
                </div>
                <div className="font-mono text-title-md text-ink mb-1">
                   {bonusDisplay} Market Value
                </div>
                <p className="text-[10px] text-muted">
                   Cumulative premium value of all identified gaps in your roadmap.
                </p>
             </div>
          </div>
        </div>
      </div>

      {/* Progress Footer */}
      <div className="px-8 py-5 bg-surface-soft/80 border-t border-hairline flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
           <div className="w-40 h-1.5 bg-hairline rounded-full overflow-hidden">
             <motion.div 
                className="h-full bg-brand-teal"
                initial={{ width: 0 }}
                animate={{ width: `${gapProgress}%` }}
             />
           </div>
           <span className="text-[10px] font-bold text-muted uppercase tracking-widest">
             {masteredGapsCount} / {totalGapsCount} Gaps Mastered
           </span>
        </div>
        
        <div className="flex items-center gap-2 text-[10px] text-muted font-bold uppercase tracking-widest">
          <DollarSign size={12} className="text-brand-teal" />
          Benchmark: {formatSalary(trajectory.current_salary)} → {formatSalary(trajectory.next_salary)}
        </div>
      </div>
    </div>
  );
}

