'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, RefreshCw, Cpu, Zap } from 'lucide-react';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  isExecutingAgent?: boolean;
  executingAgentName?: string;
}

interface AtlasCopilotChatProps {
  sessionContext: {
    sessionState?: any;
    digitalTwin?: any;
    skillGap?: any;
    roleMatches?: any;
    roadmap?: any;
    fairnessAudit?: any;
    employerReadiness?: any;
    narrator?: any;
    resumeText?: string;
  };
  onExecuteAgentCommand?: (command: { agentId: string; params?: any }) => Promise<{
    success: boolean;
    agentName?: string;
    deltaSummary?: string;
    updatedSessionState?: any;
  }>;
}

const QUICK_PROMPT_CHIPS = [
  { label: '🎯 Am I ready to apply right now?', prompt: 'Am I ready to apply right now or should I build roadmap projects first?' },
  { label: '🔍 What skill gaps should I fix first?', prompt: 'What specific skill gaps from my Agent 3 evaluation should I prioritize?' },
  { label: '🚀 Which project from my roadmap should I build?', prompt: 'Which project from my 8-week roadmap will give me the highest recruiter impact?' },
  { label: '💼 What job roles fit my profile best?', prompt: 'What specific job titles and company types match my candidate twin best?' },
];

const AGENT_COMMAND_CHIPS = [
  { label: '⚡ Recalculate Employer Readiness', prompt: 'Recalculate Employer Readiness with enterprise remote policy criteria' },
  { label: '🔄 Rebuild Roadmap for 20h/wk', prompt: 'Rebuild roadmap for 20 hours a week commitment' },
  { label: '🎯 Recalibrate Roles for Cybersecurity', prompt: 'Recalibrate role matches specifically for Cybersecurity' },
  { label: '🛡️ Re-audit Fairness Policies', prompt: 'Re-audit fairness and inclusion gap immunity policy' },
];

function parseInlineFormatting(text: string): React.ReactNode[] {
  // Split on bold (**text**) and italic (*text*)
  const parts = text.split(/(\*\*.*?\*\*|\*.*?\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      return (
        <strong key={i} className="font-bold text-ink dark:text-white">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
      return (
        <em key={i} className="italic text-brand-pink font-serif">
          {part.slice(1, -1)}
        </em>
      );
    }
    return part;
  });
}

function renderMarkdownContent(content: string) {
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];

  lines.forEach((line, index) => {
    const trimmed = line.trim();
    if (!trimmed) {
      elements.push(<div key={index} className="h-1.5" />);
      return;
    }

    if (trimmed === '***' || trimmed === '---') {
      elements.push(<hr key={index} className="my-2.5 border-hairline/60" />);
      return;
    }

    if (trimmed.startsWith('### ') || trimmed.startsWith('## ')) {
      const headerText = trimmed.replace(/^#+\s*/, '');
      elements.push(
        <h4 key={index} className="text-xs sm:text-sm font-extrabold text-brand-pink uppercase tracking-wider mt-3 mb-1 font-mono">
          {parseInlineFormatting(headerText)}
        </h4>
      );
      return;
    }

    if (trimmed.startsWith('* ') || trimmed.startsWith('• ') || trimmed.startsWith('- ')) {
      const bulletText = trimmed.replace(/^[\*\•\-]\s*/, '');
      elements.push(
        <div key={index} className="flex items-start gap-2.5 my-1 text-xs sm:text-sm leading-relaxed">
          <span className="w-1.5 h-1.5 rounded-full bg-brand-pink shrink-0 mt-2" />
          <span className="flex-1">{parseInlineFormatting(bulletText)}</span>
        </div>
      );
      return;
    }

    // Standard Paragraph
    elements.push(
      <p key={index} className="my-0.5 leading-relaxed text-xs sm:text-sm">
        {parseInlineFormatting(trimmed)}
      </p>
    );
  });

  return elements;
}

export default function AtlasCopilotChat({ sessionContext, onExecuteAgentCommand }: AtlasCopilotChatProps) {
  // Persistent Session Memory: Restores chat history until tab/session is closed
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = sessionStorage.getItem('atlas_copilot_chat_history');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch {
        // Fallback
      }
    }
    return [
      {
        id: 'init-1',
        role: 'assistant',
        content: `Hello! I am your **Atlas Career Copilot & Swarm Controller**.\n\nI give you **honest evaluations** of your market readiness and let you **control all 14 agents live** via text!\n\nTell me: *"Recalculate Employer Readiness"*, *"Rebuild roadmap for 20h/wk"*, or *"Recalibrate matches"* and I will execute the agent live!`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ];
  });

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeExecutingAgent, setActiveExecutingAgent] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Sync chat memory to sessionStorage on every message change
  useEffect(() => {
    if (typeof window !== 'undefined' && messages.length > 0) {
      try {
        sessionStorage.setItem('atlas_copilot_chat_history', JSON.stringify(messages));
      } catch {
        // ignore
      }
    }
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading, activeExecutingAgent]);

  const handleSend = async (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query || loading) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/atlas/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMsg].map((m) => ({ role: m.role, content: m.content })),
          sessionContext,
        }),
      });

      const data = await res.json();
      if (data.success && data.reply) {
        const botMsg: ChatMessage = {
          id: `bot-${Date.now()}`,
          role: 'assistant',
          content: data.reply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, botMsg]);

        // Check if an Agent Execution command was detected!
        if (data.actionCommand && data.actionCommand.type === 'EXECUTE_AGENT' && onExecuteAgentCommand) {
          setActiveExecutingAgent(data.actionCommand.agentName || 'Agent Execution');

          try {
            const execResult = await onExecuteAgentCommand(data.actionCommand);
            if (execResult && execResult.success) {
              const confirmMsg: ChatMessage = {
                id: `exec-confirm-${Date.now()}`,
                role: 'assistant',
                content: `### ⚡ AGENT RE-EXECUTION COMPLETE\n\n* **Agent:** ${execResult.agentName || data.actionCommand.agentName}\n* **Result:** ${execResult.deltaSummary || 'Updated dashboard metrics'}\n* **Status:** Your live dashboard tabs have been updated in real-time.`,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              };
              setMessages((prev) => [...prev, confirmMsg]);
            }
          } catch (execErr) {
            console.error('Agent command execution error:', execErr);
          } finally {
            setActiveExecutingAgent(null);
          }
        }
      } else {
        throw new Error(data.error || 'Failed to generate response.');
      }
    } catch (err) {
      console.error('Copilot Chat error:', err);
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: `I experienced a temporary connection issue. Based on your Atlas analysis, your top recommended role is **${
          sessionContext.roleMatches?.[0]?.role || 'Data Specialist'
        }** (${sessionContext.roleMatches?.[0]?.fit_percentage || 88}% fit).`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleResetChat = () => {
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.removeItem('atlas_copilot_chat_history');
      } catch {
        // ignore
      }
    }
    setMessages([
      {
        id: 'init-reset',
        role: 'assistant',
        content: 'Chat memory reset. What agent command would you like to execute next?',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  return (
    <div
      data-lenis-prevent="true"
      className="flex flex-col h-[550px] sm:h-[600px] max-h-[78vh] w-full bg-surface-card border-2 border-hairline rounded-3xl overflow-hidden shadow-2xl min-h-0"
    >
      {/* Header Bar */}
      <div className="p-3.5 sm:p-4 bg-surface-soft border-b border-hairline flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-2xl bg-brand-pink/15 border border-brand-pink/30 text-brand-pink flex items-center justify-center font-bold shadow-sm shrink-0">
            <Cpu className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-xs sm:text-sm font-extrabold text-ink truncate">Atlas Swarm Command Copilot</h3>
              <span className="px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-mono font-bold uppercase bg-brand-pink/10 text-brand-pink border border-brand-pink/20 shrink-0 flex items-center gap-1">
                <Zap className="w-3 h-3 text-brand-pink animate-pulse" />
                Live Swarm Control
              </span>
            </div>
            <p className="text-[10px] sm:text-[11px] text-muted font-mono truncate">
              Interactive 14-Agent Controller • Real-Time Tab Updates
            </p>
          </div>
        </div>

        <button
          onClick={handleResetChat}
          className="p-1.5 sm:p-2 rounded-xl bg-surface-card hover:bg-surface-strong text-muted hover:text-ink border border-hairline transition-colors text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer active:scale-[0.97] shrink-0 mr-6 sm:mr-0"
          title="Reset Chat Memory"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Reset</span>
        </button>
      </div>

      {/* Messages Scroll View */}
      <div
        data-lenis-prevent="true"
        className="flex-1 min-h-0 p-3.5 sm:p-5 overflow-y-auto overscroll-contain touch-pan-y space-y-3.5 font-sans text-xs sm:text-sm selection:bg-brand-pink/20"
      >
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.role === 'assistant' && (
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-brand-pink/15 text-brand-pink border border-brand-pink/30 flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
            )}

            <div
              className={`max-w-[88%] sm:max-w-[80%] rounded-2xl p-3.5 sm:p-4 leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-ink text-on-primary rounded-tr-none shadow-sm'
                  : 'bg-surface-soft border border-hairline text-ink rounded-tl-none shadow-sm'
              }`}
            >
              <div className="font-sans">
                {renderMarkdownContent(msg.content)}
              </div>
              <div
                className={`text-[9px] sm:text-[10px] font-mono mt-2 text-right ${
                  msg.role === 'user' ? 'text-on-primary/60' : 'text-muted'
                }`}
              >
                {msg.timestamp}
              </div>
            </div>

            {msg.role === 'user' && (
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-ink text-on-primary flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                <User className="w-3.5 h-3.5" />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex gap-2.5 justify-start">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-brand-pink/15 text-brand-pink border border-brand-pink/30 flex items-center justify-center shrink-0 animate-pulse">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <div className="bg-surface-soft border border-hairline rounded-2xl rounded-tl-none p-3.5 text-xs font-mono text-muted flex items-center gap-3">
              <div className="w-3.5 h-3.5 border-2 border-brand-pink border-t-transparent rounded-full animate-spin" />
              <span>Analyzing command & evaluating swarm state...</span>
            </div>
          </div>
        )}

        {activeExecutingAgent && (
          <div className="flex gap-2.5 justify-start animate-in fade-in duration-200">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 flex items-center justify-center shrink-0 animate-pulse">
              <Zap className="w-3.5 h-3.5" />
            </div>
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl rounded-tl-none p-3.5 text-xs font-mono text-emerald-400 flex items-center gap-3 shadow-md">
              <div className="w-3.5 h-3.5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
              <span className="font-bold">⚡ Executing {activeExecutingAgent}... Updating dashboard live</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Swarm Agent Command Chips */}
      <div
        data-lenis-prevent="true"
        className="px-3 py-2 bg-surface-soft/80 border-t border-hairline overflow-x-auto overscroll-contain flex items-center gap-2 shrink-0"
      >
        <span className="text-[9px] sm:text-[10px] font-mono font-bold text-brand-pink uppercase shrink-0 flex items-center gap-1">
          <Zap className="w-3 h-3 inline" /> Swarm Controls:
        </span>
        {AGENT_COMMAND_CHIPS.map((chip, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(chip.prompt)}
            disabled={loading || !!activeExecutingAgent}
            className="px-2.5 py-1 rounded-xl bg-surface-card hover:bg-brand-pink/10 hover:border-brand-pink/50 text-ink border border-hairline text-[11px] font-sans font-semibold whitespace-nowrap transition-all cursor-pointer active:scale-[0.97] shrink-0 disabled:opacity-50"
          >
            {chip.label}
          </button>
        ))}
      </div>

      {/* Standard Prompt Chips */}
      <div
        data-lenis-prevent="true"
        className="px-3 py-1.5 bg-surface-soft/50 border-t border-hairline/60 overflow-x-auto overscroll-contain flex items-center gap-2 shrink-0"
      >
        <span className="text-[9px] sm:text-[10px] font-mono font-bold text-muted uppercase shrink-0">Prompts:</span>
        {QUICK_PROMPT_CHIPS.map((chip, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(chip.prompt)}
            disabled={loading || !!activeExecutingAgent}
            className="px-2 py-0.5 rounded-lg bg-surface-card hover:bg-surface-strong text-muted hover:text-ink border border-hairline text-[10px] font-sans whitespace-nowrap transition-all cursor-pointer shrink-0 disabled:opacity-50"
          >
            {chip.label}
          </button>
        ))}
      </div>

      {/* Input Box */}
      <div className="p-3 bg-surface-card border-t border-hairline flex items-center gap-2 sm:gap-3 shrink-0">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Command agents (e.g. 'Recalculate Employer Readiness', 'Rebuild roadmap for 20h/wk')..."
          disabled={loading || !!activeExecutingAgent}
          className="flex-1 bg-surface-soft border border-hairline rounded-2xl px-3.5 py-2.5 text-xs font-sans text-ink placeholder:text-muted/60 focus:outline-none focus:border-brand-pink/60 transition-all"
        />
        <button
          onClick={() => handleSend()}
          disabled={loading || !input.trim() || !!activeExecutingAgent}
          className="py-2.5 px-4 sm:px-5 rounded-2xl bg-primary dark:bg-brand-pink text-on-primary dark:text-white font-sans font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-sm hover:opacity-90 active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 shrink-0"
        >
          <span>Send</span>
          <Send className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
