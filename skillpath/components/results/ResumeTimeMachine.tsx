'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  TrendingUp,
  Clock,
  Zap,
  Lock,
  Check,
  Plus,
  Trophy,
  Users,
  BarChart3,
  DollarSign,
  Briefcase,
  Sliders,
  Bot,
  Info,
  Activity
} from 'lucide-react';
import type { SkillGap } from '@/types/analysis';

// Import @bklit UI chart components and tooltips
import { AreaChart } from '@/components/charts/area-chart';
import { Area } from '@/components/charts/area';
import { BarChart } from '@/components/charts/bar-chart';
import { Bar } from '@/components/charts/bar';
import { ChartTooltip } from '@/components/charts/tooltip';
import { XAxis } from '@/components/charts/x-axis';
import { BarXAxis } from '@/components/charts/bar-x-axis';
import { YAxis } from '@/components/charts/y-axis';

interface ResumeTimeMachineProps {
  roleLabel?: string;
  baseSalary?: number;
  skillGaps?: SkillGap[];
  mvcSkills?: string[];
}

const DEFAULT_ACCELERATOR_SKILLS = [
  { name: 'System Architecture', boost: 22000, category: 'Backend' },
  { name: 'AI & Agent Systems', boost: 28000, category: 'AI/ML' },
  { name: 'Kubernetes & Cloud', boost: 18000, category: 'DevOps' },
  { name: 'GraphQL & Microservices', boost: 14000, category: 'Fullstack' },
  { name: 'Performance Optimization', boost: 12000, category: 'Frontend' }
];

export function ResumeTimeMachine({
  roleLabel = 'Software Engineer',
  baseSalary = 95000,
  skillGaps = [],
  mvcSkills = []
}: ResumeTimeMachineProps) {
  // Interactive User Input States
  const [editableRole, setEditableRole] = useState<string>(roleLabel);
  const [editableSalary, setEditableSalary] = useState<number>(baseSalary);
  const [newSkillText, setNewSkillText] = useState<string>('');
  const [customUserSkills, setCustomUserSkills] = useState<{ name: string; boost: number; category: string }[]>([]);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  // Update when props change
  useEffect(() => {
    if (roleLabel) setEditableRole(roleLabel);
  }, [roleLabel]);

  useEffect(() => {
    if (baseSalary) setEditableSalary(baseSalary);
  }, [baseSalary]);

  const [selectedYearIndex, setSelectedYearIndex] = useState<number>(2); // Default to Year 2
  const [chartViewMode, setChartViewMode] = useState<'visual' | 'area' | 'bar'>('visual');
  const [activeAccelerators, setActiveAccelerators] = useState<string[]>([]);

  // Combine top skill gaps + default accelerators + user added custom skills
  const availableAccelerators = useMemo(() => {
    const fromGaps = skillGaps.slice(0, 4).map((g, i) => ({
      name: g.skill,
      boost: 15000 + (g.in_mvc ? 8000 : 4000) + (i * 2000),
      category: 'Gap Skill'
    }));

    const combined = [...fromGaps, ...customUserSkills];
    DEFAULT_ACCELERATOR_SKILLS.forEach(def => {
      if (!combined.some(c => c.name.toLowerCase() === def.name.toLowerCase())) {
        combined.push(def);
      }
    });

    return combined;
  }, [skillGaps, customUserSkills]);

  // Set default active accelerators once availableAccelerators load
  useEffect(() => {
    if (activeAccelerators.length === 0 && availableAccelerators.length > 0) {
      setActiveAccelerators([
        availableAccelerators[0]?.name || 'System Architecture',
        availableAccelerators[1]?.name || 'AI & Agent Systems'
      ]);
    }
  }, [availableAccelerators]);

  const toggleAccelerator = (skillName: string) => {
    setActiveAccelerators(prev =>
      prev.includes(skillName)
        ? prev.filter(s => s !== skillName)
        : [...prev, skillName]
    );
  };

  const handleAddCustomSkill = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSkillText.trim()) return;

    const skillName = newSkillText.trim();
    if (!availableAccelerators.some(a => a.name.toLowerCase() === skillName.toLowerCase())) {
      const newAcc = {
        name: skillName,
        boost: 18000 + Math.floor(Math.random() * 8000),
        category: 'Custom'
      };
      setCustomUserSkills(prev => [...prev, newAcc]);
      setActiveAccelerators(prev => [...prev, skillName]);
    }
    setNewSkillText('');
  };

  // Calculate salary & percentile trajectory data for 4 time horizons (Y0, Y1, Y2, Y3)
  const trajectoryData = useMemo(() => {
    const currentSalary = Number(editableSalary) || 95000;
    const currentRole = editableRole.trim() || 'Software Engineer';

    const totalBoost = activeAccelerators.reduce((sum, name) => {
      const found = availableAccelerators.find(a => a.name === name);
      return sum + (found?.boost || 15000);
    }, 0);

    const cleanRole = currentRole.replace(/Senior|Junior|Staff|Principal|Associate|Lead/gi, '').trim() || currentRole;

    const years = [
      {
        yearLabel: 'Now (Year 0)',
        shortYear: 'Now',
        month: 0,
        baseSalary: currentSalary,
        accSalary: currentSalary,
        percentile: 45,
        title: currentRole,
        demandGrowth: 8,
        unlocked: true,
        unlockedBy: 'Current Baseline',
        aiAdvice: `Currently matching ~45% of high-paying ${currentRole} roles. Focus on high-impact backend & AI skill gaps to unlock fast promotions.`
      },
      {
        yearLabel: 'Year 1 (12 Months)',
        shortYear: 'Yr 1',
        month: 12,
        baseSalary: Math.round(currentSalary * 1.08),
        accSalary: Math.round((currentSalary * 1.08) + (totalBoost * 0.45)),
        percentile: Math.min(85, 45 + activeAccelerators.length * 8),
        title: `Senior ${cleanRole}`,
        demandGrowth: 18,
        unlocked: activeAccelerators.length >= 1,
        unlockedBy: activeAccelerators[0] || '1 Skill Mastered',
        aiAdvice: `Mastering ${activeAccelerators[0] || 'core gap skills'} elevates your technical depth, qualifying you for Senior ${cleanRole} positions with a strong salary jump.`
      },
      {
        yearLabel: 'Year 2 (24 Months)',
        shortYear: 'Yr 2',
        month: 24,
        baseSalary: Math.round(currentSalary * 1.18),
        accSalary: Math.round((currentSalary * 1.18) + (totalBoost * 0.80)),
        percentile: Math.min(94, 55 + activeAccelerators.length * 10),
        title: `Staff ${cleanRole} Specialist`,
        demandGrowth: 32,
        unlocked: activeAccelerators.length >= 2,
        unlockedBy: activeAccelerators.slice(0, 2).join(' + ') || '2 Skills Mastered',
        aiAdvice: `Adding ${activeAccelerators.slice(0, 2).join(' and ') || 'advanced architecture'} places you in the top 10% of applicants with high demand from top-tier tech companies.`
      },
      {
        yearLabel: 'Year 3 (36 Months)',
        shortYear: 'Yr 3',
        month: 36,
        baseSalary: Math.round(currentSalary * 1.28),
        accSalary: Math.round((currentSalary * 1.28) + (totalBoost * 1.15)),
        percentile: Math.min(99, 65 + activeAccelerators.length * 11),
        title: `Principal ${cleanRole} Lead`,
        demandGrowth: 45,
        unlocked: activeAccelerators.length >= 3,
        unlockedBy: activeAccelerators.slice(0, 3).join(' + ') || '3 Skills Mastered',
        aiAdvice: `With 3+ mastered accelerators, your market positioning hits the top percentile. You can command Principal/Lead roles with equity and max market compensation.`
      }
    ];

    return years;
  }, [editableSalary, editableRole, activeAccelerators, availableAccelerators]);

  // Formatted data array for @bklit chart components with distinct dates to avoid key collisions
  const bklitChartData = useMemo(() => {
    const startYear = new Date().getFullYear();
    const distinctMonths = [0, 3, 6, 9]; // Jan 1, Apr 1, Jul 1, Oct 1 -> Unique shortDateFmt keys!
    return trajectoryData.map((d, index) => ({
      date: new Date(startYear, distinctMonths[index % 4], 1),
      Baseline: d.baseSalary,
      Accelerated: d.accSalary,
      Demand: d.demandGrowth
    }));
  }, [trajectoryData]);

  const displayIdx = hoveredIdx !== null ? hoveredIdx : selectedYearIndex;
  const activePoint = trajectoryData[displayIdx];
  const totalSalaryBoost = activePoint.accSalary - activePoint.baseSalary;

  // Custom SVG path calculation for high-vis interactive visual graph
  const chartW = 760;
  const chartH = 240;
  const padX = 60;
  const padY = 40;
  const maxSal = Math.max(...trajectoryData.map(d => d.accSalary)) * 1.1;
  const minSal = Math.min(...trajectoryData.map(d => d.baseSalary)) * 0.85;

  const svgPoints = trajectoryData.map((d, index) => {
    const x = padX + (index * (chartW - 2 * padX) / 3);
    const yAcc = chartH - padY - ((d.accSalary - minSal) / (maxSal - minSal)) * (chartH - 2 * padY);
    const yBase = chartH - padY - ((d.baseSalary - minSal) / (maxSal - minSal)) * (chartH - 2 * padY);
    return { x, yAcc, yBase, ...d };
  });

  const createCurvedPath = (pts: { x: number; yAcc: number }[]) => {
    if (pts.length === 0) return '';
    let path = `M ${pts[0].x} ${pts[0].yAcc}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i];
      const p1 = pts[i + 1];
      const cp1x = p0.x + (p1.x - p0.x) / 2;
      const cp1y = p0.yAcc;
      const cp2x = p0.x + (p1.x - p0.x) / 2;
      const cp2y = p1.yAcc;
      path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p1.x} ${p1.yAcc}`;
    }
    return path;
  };

  const accLinePath = createCurvedPath(svgPoints);
  const accAreaPath = `${accLinePath} L ${svgPoints[svgPoints.length - 1].x} ${chartH - padY} L ${svgPoints[0].x} ${chartH - padY} Z`;

  return (
    <div id="resume-time-machine" className="w-full bg-[#EBE9DC] dark:bg-surface-card border border-hairline rounded-[36px] md:rounded-[40px] p-6 md:p-10 shadow-2xl relative overflow-hidden backdrop-blur-xl transition-all">
      {/* Background glowing accents */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-brand-teal/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-brand-pink/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Component Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 pb-6 border-b border-hairline/60 gap-4 relative z-10">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-teal/10 border border-brand-teal/20 text-[10px] text-brand-teal font-bold tracking-widest uppercase mb-3">
            <Sparkles size={12} className="animate-pulse" />
            Resume Time Machine · Interactive Career Simulator
          </div>
          <h2 className="font-display text-2xl md:text-3xl font-bold text-ink tracking-tight">
            Simulate Your Future Profile & Salary Trajectory
          </h2>
          <p className="font-sans text-body-sm text-muted mt-1 max-w-xl">
            Customize target role, salary baseline, and skill accelerators. Hover over graph points or bars to inspect real-time AI career advice & salary data.
          </p>
        </div>

        {/* Live HUD Badge */}
        <div className="flex items-center gap-3 bg-canvas/80 p-3.5 rounded-2xl border border-hairline shrink-0 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-brand-teal/15 flex items-center justify-center text-brand-teal font-bold">
            <TrendingUp size={20} />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted block">Accelerated 3-Yr Target</span>
            <span className="font-mono text-xl font-bold text-brand-teal">
              ${trajectoryData[3].accSalary.toLocaleString()}/yr
            </span>
          </div>
        </div>
      </div>

      {/* 🎛️ REAL-TIME USER INPUT CONTROL PANEL */}
      <div className="mb-8 p-6 rounded-3xl bg-canvas border border-hairline space-y-6 shadow-sm relative z-10">
        <div className="flex items-center justify-between border-b border-hairline/60 pb-3">
          <span className="text-[10px] font-bold uppercase tracking-widest text-brand-teal flex items-center gap-1.5">
            <Sliders size={14} /> Interactive Simulation Parameters
          </span>
          <span className="text-[10px] text-muted font-medium">Type values below to re-simulate trajectory</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
          {/* Target Role Input */}
          <div className="md:col-span-5 space-y-1.5">
            <label className="text-body-xs font-bold text-ink flex items-center gap-1.5">
              <Briefcase size={14} className="text-brand-pink" /> Target Job Title:
            </label>
            <input
              type="text"
              value={editableRole}
              onChange={(e) => setEditableRole(e.target.value)}
              placeholder="e.g. Fullstack Engineer, AI Developer"
              className="w-full bg-surface-soft border border-hairline rounded-xl px-4 py-2.5 text-body-sm font-semibold text-ink focus:outline-none focus:border-brand-pink transition-colors"
            />
          </div>

          {/* Current Base Salary Input */}
          <div className="md:col-span-4 space-y-1.5">
            <label className="text-body-xs font-bold text-ink flex items-center gap-1.5">
              <DollarSign size={14} className="text-emerald-500" /> Baseline Annual Salary ($):
            </label>
            <input
              type="number"
              value={editableSalary}
              step={5000}
              min={30000}
              max={500000}
              onChange={(e) => setEditableSalary(Number(e.target.value))}
              className="w-full bg-surface-soft border border-hairline rounded-xl px-4 py-2.5 text-body-sm font-mono font-semibold text-ink focus:outline-none focus:border-brand-pink transition-colors"
            />
          </div>

          {/* Add Custom Skill Form */}
          <form onSubmit={handleAddCustomSkill} className="md:col-span-3 flex gap-2">
            <div className="w-full space-y-1.5">
              <label className="text-body-xs font-bold text-ink flex items-center gap-1.5">
                <Plus size={14} className="text-amber-400" /> Add Custom Skill:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newSkillText}
                  onChange={(e) => setNewSkillText(e.target.value)}
                  placeholder="e.g. Rust, PyTorch"
                  className="w-full bg-surface-soft border border-hairline rounded-xl px-3 py-2.5 text-body-xs font-semibold text-ink focus:outline-none focus:border-brand-teal transition-colors"
                />
                <button
                  type="submit"
                  className="bg-brand-teal text-white font-bold text-xs px-3 py-2.5 rounded-xl hover:opacity-90 active:scale-95 transition-all shrink-0"
                >
                  Add
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Interactive Time Horizon Selector with Hover Support */}
      <div className="mb-8 relative z-10">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted flex items-center gap-1.5">
            <Clock size={12} /> Select Time Horizon (Hover to Preview):
          </span>
          <span className="text-body-xs font-semibold text-brand-teal">
            Viewing: {activePoint.yearLabel}
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3 bg-canvas/60 p-2 rounded-2xl border border-hairline">
          {trajectoryData.map((d, idx) => (
            <button
              key={d.yearLabel}
              onClick={() => setSelectedYearIndex(idx)}
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
              className={`relative py-3 px-4 rounded-xl text-xs font-bold transition-all text-center flex flex-col items-center justify-center gap-1 ${
                selectedYearIndex === idx
                  ? 'text-on-primary font-semibold shadow-md'
                  : 'text-muted hover:text-ink hover:bg-surface-soft'
              }`}
            >
              {selectedYearIndex === idx && (
                <motion.div
                  layoutId="active-time-pill"
                  className="absolute inset-0 bg-primary rounded-xl"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <span className="relative z-10 text-[11px] uppercase tracking-wider">{d.yearLabel.split(' ')[0]} {d.yearLabel.split(' ')[1]}</span>
              <span className="relative z-10 font-mono text-body-xs opacity-90">${(d.accSalary / 1000).toFixed(0)}k/yr</span>
            </button>
          ))}
        </div>
      </div>

      {/* Skill Accelerators Toggle Bar */}
      <div className="mb-8 p-6 rounded-3xl bg-canvas/70 border border-hairline space-y-4 relative z-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted flex items-center gap-1.5">
              <Zap size={12} className="text-amber-400" /> Skill Accelerators (Click to Toggle On / Off)
            </span>
            <p className="text-body-xs text-muted">
              Select skills to learn — watch your salary curve bend upward in real time.
            </p>
          </div>
          <span className="text-body-xs font-bold text-brand-teal bg-brand-teal/10 px-3 py-1 rounded-full border border-brand-teal/20 shrink-0">
            {activeAccelerators.length} Active Boosters (+${(activeAccelerators.reduce((sum, n) => sum + (availableAccelerators.find(a => a.name === n)?.boost || 15000), 0) / 1000).toFixed(0)}k/yr)
          </span>
        </div>

        <div className="flex flex-wrap gap-2.5">
          {availableAccelerators.map(acc => {
            const isActive = activeAccelerators.includes(acc.name);
            return (
              <button
                key={acc.name}
                onClick={() => toggleAccelerator(acc.name)}
                className={`px-4 py-2 rounded-xl text-body-xs font-semibold border transition-all flex items-center gap-2 ${
                  isActive
                    ? 'bg-brand-teal/15 border-brand-teal text-brand-teal shadow-sm scale-105'
                    : 'bg-surface-soft/80 border-hairline text-muted hover:border-ink/20 hover:text-ink'
                }`}
              >
                {isActive ? <Check size={14} className="text-brand-teal" /> : <Plus size={14} />}
                <span>{acc.name}</span>
                <span className="font-mono text-[10px] opacity-75 font-bold">
                  +${(acc.boost / 1000).toFixed(0)}k
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 📊 HIGH-VISIBILITY GRAPH WITH DATA NUMBERS & HOVER INSIGHTS */}
      <div className="mb-8 p-6 rounded-3xl bg-canvas border border-hairline relative z-10 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-3">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-brand-teal flex items-center gap-1.5">
              <Activity size={14} /> 36-Month Salary Trajectory Curve
            </span>
            <p className="text-body-xs text-muted">Hover over graph nodes to view instant salary numbers & AI insights.</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setChartViewMode('visual')}
              className={`px-3 py-1.5 rounded-lg text-body-xs font-bold transition-all flex items-center gap-1.5 ${
                chartViewMode === 'visual'
                  ? 'bg-brand-teal text-white shadow-sm'
                  : 'bg-surface-soft text-muted hover:text-ink'
              }`}
            >
              <Activity size={12} /> High-Vis Graph
            </button>
            <button
              onClick={() => setChartViewMode('area')}
              className={`px-3 py-1.5 rounded-lg text-body-xs font-bold transition-all flex items-center gap-1.5 ${
                chartViewMode === 'area'
                  ? 'bg-brand-teal text-white shadow-sm'
                  : 'bg-surface-soft text-muted hover:text-ink'
              }`}
            >
              <TrendingUp size={12} /> @bklit Area
            </button>
            <button
              onClick={() => setChartViewMode('bar')}
              className={`px-3 py-1.5 rounded-lg text-body-xs font-bold transition-all flex items-center gap-1.5 ${
                chartViewMode === 'bar'
                  ? 'bg-brand-teal text-white shadow-sm'
                  : 'bg-surface-soft text-muted hover:text-ink'
              }`}
            >
              <BarChart3 size={12} /> @bklit Bar
            </button>
          </div>
        </div>

        {/* VISUAL INTERACTIVE SVG GRAPH MODE (Always shows clear data numbers + hover tooltips) */}
        {chartViewMode === 'visual' ? (
          <div className="w-full relative py-4">
            <svg viewBox={`0 0 ${chartW} ${chartH}`} className="w-full h-auto overflow-visible select-none">
              <defs>
                <linearGradient id="accAreaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0D9488" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#0D9488" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              {[0, 0.33, 0.66, 1].map((pct, idx) => {
                const y = padY + pct * (chartH - 2 * padY);
                const gridVal = Math.round(maxSal - pct * (maxSal - minSal));
                return (
                  <g key={idx}>
                    <line x1={padX} y1={y} x2={chartW - padX} y2={y} stroke="currentColor" strokeOpacity="0.08" strokeDasharray="4 4" />
                    <text x={padX - 10} y={y + 4} textAnchor="end" fill="currentColor" opacity="0.4" fontSize="10" fontWeight="bold">
                      ${(gridVal / 1000).toFixed(0)}k
                    </text>
                  </g>
                );
              })}

              {/* Area Under Accelerated Curve */}
              <path d={accAreaPath} fill="url(#accAreaGrad)" />

              {/* Accelerated Trajectory Line */}
              <path d={accLinePath} fill="none" stroke="#0D9488" strokeWidth="4" strokeLinecap="round" />

              {/* Graph Node Points + Hover Callout Badges with exact Salary Numbers */}
              {svgPoints.map((pt, idx) => {
                const isSelected = displayIdx === idx;
                return (
                  <g
                    key={pt.yearLabel}
                    className="cursor-pointer group"
                    onClick={() => setSelectedYearIndex(idx)}
                    onMouseEnter={() => setHoveredIdx(idx)}
                    onMouseLeave={() => setHoveredIdx(null)}
                  >
                    {/* Vertical guideline on hover/select */}
                    <line
                      x1={pt.x}
                      y1={padY}
                      x2={pt.x}
                      y2={chartH - padY}
                      stroke="#0D9488"
                      strokeOpacity={isSelected ? 0.3 : 0.1}
                      strokeWidth="1.5"
                      strokeDasharray="3 3"
                    />

                    {/* Checkpoint Node */}
                    <circle
                      cx={pt.x}
                      cy={pt.yAcc}
                      r={isSelected ? 8 : 6}
                      fill="#0D9488"
                      stroke="#FFFFFF"
                      strokeWidth="2.5"
                      className="transition-all duration-200"
                    />

                    {/* Numeric Salary Callout Badge above node */}
                    <g transform={`translate(${pt.x}, ${pt.yAcc - 18})`}>
                      <rect
                        x="-38"
                        y="-16"
                        width="76"
                        height="22"
                        rx="7"
                        fill={isSelected ? '#0D9488' : '#18181B'}
                        className="shadow-md transition-colors"
                      />
                      <text
                        x="0"
                        y="-2"
                        textAnchor="middle"
                        fill="#FFFFFF"
                        fontSize="11"
                        fontWeight="bold"
                        fontFamily="monospace"
                      >
                        ${(pt.accSalary / 1000).toFixed(0)}k/yr
                      </text>
                    </g>

                    {/* X Axis Year Label */}
                    <text
                      x={pt.x}
                      y={chartH - padY + 22}
                      textAnchor="middle"
                      fill={isSelected ? '#0D9488' : 'currentColor'}
                      opacity={isSelected ? 1 : 0.6}
                      fontSize="11"
                      fontWeight="bold"
                    >
                      {pt.shortYear}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        ) : chartViewMode === 'area' ? (
          <div className="w-full h-[260px] relative">
            <AreaChart data={bklitChartData} xDataKey="date" className="w-full h-full">
              <XAxis />
              <YAxis />
              <Area dataKey="Accelerated" stroke="#0D9488" fill="#0D9488" strokeWidth={3} />
              <Area dataKey="Baseline" stroke="#A1A1AA" fill="transparent" strokeWidth={2} />
              <ChartTooltip />
            </AreaChart>
          </div>
        ) : (
          <div className="w-full h-[260px] relative">
            <BarChart data={bklitChartData} xDataKey="date" className="w-full h-full">
              <BarXAxis />
              <YAxis />
              <Bar dataKey="Accelerated" fill="#0D9488" />
              <Bar dataKey="Baseline" fill="#A1A1AA" />
              <ChartTooltip />
            </BarChart>
          </div>
        )}

        {/* 🤖 AI CAREER STRATEGIST HOVER INSIGHT OVERLAY */}
        <div className="mt-4 p-4 rounded-2xl bg-brand-pink/5 border border-brand-pink/20 flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl bg-brand-pink/15 flex items-center justify-center text-brand-pink shrink-0 mt-0.5">
            <Bot size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-brand-pink">
                AI Career Strategist Analysis · {activePoint.yearLabel}
              </span>
              {hoveredIdx !== null && (
                <span className="text-[9px] bg-brand-pink text-white px-2 py-0.5 rounded-full font-bold uppercase">
                  Hovering ${activePoint.accSalary.toLocaleString()}/yr
                </span>
              )}
            </div>
            <p className="text-body-xs font-medium text-ink leading-relaxed">
              {activePoint.aiAdvice}
            </p>
          </div>
        </div>
      </div>

      {/* Active Horizon Insights & Career Level Unlocks */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch relative z-10">
        {/* Left 6: Active Year Metrics HUD */}
        <div className="lg:col-span-6 bg-canvas p-6 rounded-3xl border border-hairline flex flex-col justify-between space-y-6">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted">
                {activePoint.yearLabel} Status
              </span>
              <span className="px-3 py-1 rounded-full bg-brand-teal/15 text-brand-teal text-body-xs font-bold">
                {totalSalaryBoost > 0 ? `+$${(totalSalaryBoost / 1000).toFixed(0)}k/yr Skill Premium` : 'Baseline'}
              </span>
            </div>

            <div className="flex items-baseline gap-2 mb-2">
              <span className="font-display text-4xl font-extrabold text-ink">${activePoint.accSalary.toLocaleString()}</span>
              <span className="text-muted font-sans text-body-sm">/ year</span>
            </div>
            <p className="text-body-xs text-muted">
              Projected total compensation including base salary, skill multipliers, and seniority bumps for <span className="font-bold text-ink">{editableRole}</span>.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-hairline">
            <div className="p-3 rounded-2xl bg-surface-soft/80 border border-hairline">
              <div className="flex items-center gap-1.5 text-muted text-[10px] font-bold uppercase tracking-widest mb-1">
                <Users size={12} className="text-brand-teal" /> Market Rank
              </div>
              <span className="font-display text-lg font-bold text-ink">Top {100 - activePoint.percentile}%</span>
              <span className="text-[10px] text-muted block">of applicant pool</span>
            </div>

            <div className="p-3 rounded-2xl bg-surface-soft/80 border border-hairline">
              <div className="flex items-center gap-1.5 text-muted text-[10px] font-bold uppercase tracking-widest mb-1">
                <TrendingUp size={12} className="text-brand-pink" /> Hiring Demand
              </div>
              <span className="font-display text-lg font-bold text-ink">+{activePoint.demandGrowth}%</span>
              <span className="text-[10px] text-muted block">YoY open roles</span>
            </div>
          </div>
        </div>

        {/* Right 6: Unlockable Job Titles Progression */}
        <div className="lg:col-span-6 bg-canvas p-6 rounded-3xl border border-hairline flex flex-col justify-between space-y-4">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted block mb-3">
              🏆 Unlockable Career Roles & Seniority Titles
            </span>
            <div className="space-y-2.5">
              {trajectoryData.map((d, idx) => {
                const isCurrent = displayIdx === idx;
                return (
                  <div
                    key={d.yearLabel}
                    onClick={() => setSelectedYearIndex(idx)}
                    onMouseEnter={() => setHoveredIdx(idx)}
                    onMouseLeave={() => setHoveredIdx(null)}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                      isCurrent
                        ? 'bg-brand-teal/10 border-brand-teal/40 shadow-sm'
                        : d.unlocked
                        ? 'bg-surface-soft/60 border-hairline hover:bg-surface-soft'
                        : 'bg-surface-soft/30 border-hairline/40 opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-body-xs ${
                        d.unlocked ? 'bg-amber-400/20 text-amber-500 border border-amber-400/40' : 'bg-surface-soft text-muted'
                      }`}>
                        {d.unlocked ? <Trophy size={14} /> : <Lock size={14} />}
                      </div>
                      <div>
                        <h4 className="font-sans font-bold text-body-sm text-ink">{d.title}</h4>
                        <span className="text-[10px] text-muted block">{d.yearLabel.split(' ')[0]} ({d.unlockedBy})</span>
                      </div>
                    </div>

                    <span className="font-mono text-body-xs font-bold text-brand-teal">
                      ${(d.accSalary / 1000).toFixed(0)}k/yr
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
