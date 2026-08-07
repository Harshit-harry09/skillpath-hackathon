'use client';
// updated

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, ChevronDown, ChevronUp, Cpu, Brain, Map, Pencil, Zap } from 'lucide-react';

interface TraceEvent {
  timestamp: number;
  actor: string;
  message: string;
  durationMs?: number;
}

const ACTOR_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  orchestrator: { label: 'Orchestrator', color: '#A78BFA', icon: <Cpu className="w-3.5 h-3.5" /> },
  agent1: { label: 'Agent 1 · Market', color: '#34D399', icon: <Activity className="w-3.5 h-3.5" /> },
  agent2: { label: 'Agent 2 · Resume', color: '#60A5FA', icon: <Brain className="w-3.5 h-3.5" /> },
  agent3: { label: 'Agent 3 · Roadmap', color: '#FBBF24', icon: <Map className="w-3.5 h-3.5" /> },
  agent4: { label: 'Agent 4 · Outreach', color: '#F472B6', icon: <Pencil className="w-3.5 h-3.5" /> },
};

function formatTimestamp(ts: number, baseTs: number): string {
  const delta = ts - baseTs;
  if (delta < 1000) return `+${delta}ms`;
  return `+${(delta / 1000).toFixed(1)}s`;
}

export function AgentTracePanel({ trace, className }: { trace?: TraceEvent[]; className?: string }) {
  const [isExpanded, setIsExpanded] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  const events = trace || [];
  const baseTs = events.length > 0 ? events[0].timestamp : Date.now();

  // Auto-scroll to bottom when new events arrive
  useEffect(() => {
    if (scrollRef.current && isExpanded) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [events.length, isExpanded]);

  if (events.length === 0) return null;

  // Count unique actors
  const actors = new Set(events.map(e => e.actor));
  const totalDuration = events.length > 1
    ? events[events.length - 1].timestamp - events[0].timestamp
    : 0;

  return (
    <div className={`rounded-2xl border border-white/[0.06] bg-[#0D0D12]/80 backdrop-blur-sm overflow-hidden ${className || ''}`}>
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20">
            <Zap className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-left">
            <h3 className="text-sm font-semibold text-white/90">Agent Trace</h3>
            <p className="text-[11px] text-white/40 mt-0.5">
              {events.length} events · {actors.size} agents · {totalDuration < 1000 ? `${totalDuration}ms` : `${(totalDuration / 1000).toFixed(1)}s`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Actor badges */}
          <div className="hidden sm:flex items-center gap-1">
            {Array.from(actors).map(actor => {
              const config = ACTOR_CONFIG[actor] || { label: actor, color: '#9CA3AF', icon: <Cpu className="w-3.5 h-3.5" /> };
              return (
                <span
                  key={actor}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium"
                  style={{ backgroundColor: config.color + '15', color: config.color, border: `1px solid ${config.color}30` }}
                >
                  {config.icon}
                  {config.label.split(' · ')[0]}
                </span>
              );
            })}
          </div>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-white/30" />
          ) : (
            <ChevronDown className="w-4 h-4 text-white/30" />
          )}
        </div>
      </button>

      {/* Event list */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
          >
            <div
              ref={scrollRef}
              className="max-h-[320px] overflow-y-auto border-t border-white/[0.04] scrollbar-thin"
            >
              {events.map((event, i) => {
                const config = ACTOR_CONFIG[event.actor] || { label: event.actor, color: '#9CA3AF', icon: <Cpu className="w-3.5 h-3.5" /> };
                const isDecision = event.message.includes('→') || event.message.includes('⚠️') || event.message.includes('✅') || event.message.includes('🚫');

                return (
                  <motion.div
                    key={`${event.timestamp}-${i}`}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.15, delay: i * 0.02 }}
                    className={`flex items-start gap-3 px-5 py-2.5 border-b border-white/[0.03] last:border-b-0 ${
                      isDecision ? 'bg-purple-500/[0.03]' : ''
                    }`}
                  >
                    {/* Timeline dot */}
                    <div className="flex flex-col items-center mt-1 shrink-0">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: config.color }}
                      />
                      {i < events.length - 1 && (
                        <div className="w-px h-full bg-white/[0.06] mt-1" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span
                          className="text-[10px] font-semibold uppercase tracking-wider"
                          style={{ color: config.color }}
                        >
                          {config.label}
                        </span>
                        <span className="text-[10px] text-white/20 font-mono">
                          {formatTimestamp(event.timestamp, baseTs)}
                        </span>
                        {event.durationMs !== undefined && (
                          <span className="text-[10px] text-white/30 font-mono">
                            ({event.durationMs}ms)
                          </span>
                        )}
                      </div>
                      <p className={`text-[12px] leading-relaxed ${
                        isDecision ? 'text-white/80 font-medium' : 'text-white/50'
                      }`}>
                        {event.message}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
