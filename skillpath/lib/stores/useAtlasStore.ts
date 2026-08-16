import { create } from 'zustand';
import type { AtlasSessionState } from '@/lib/atlas/orchestrator';

export interface AgentTrace {
  timestamp: number;
  agentId: string;
  agentName: string;
  status: 'running' | 'completed' | 'failed';
  message: string;
  durationMs?: number;
}

interface AtlasState {
  sessionState: Partial<AtlasSessionState>;
  traces: AgentTrace[];
  isExecuting: boolean;
  currentAgentId: string | null;
  activeDrawerTab: 'chat' | 'graph' | 'roadmap' | 'critic';
  
  // Actions
  setSessionState: (state: Partial<AtlasSessionState>) => void;
  updateSessionState: (partial: Partial<AtlasSessionState>) => void;
  addTrace: (trace: AgentTrace) => void;
  setIsExecuting: (executing: boolean) => void;
  setCurrentAgentId: (agentId: string | null) => void;
  setActiveDrawerTab: (tab: 'chat' | 'graph' | 'roadmap' | 'critic') => void;
  resetAtlas: () => void;
}

const initialSessionState: Partial<AtlasSessionState> = {};

export const useAtlasStore = create<AtlasState>((set) => ({
  sessionState: initialSessionState,
  traces: [],
  isExecuting: false,
  currentAgentId: null,
  activeDrawerTab: 'chat',

  setSessionState: (sessionState) => set({ sessionState }),
  updateSessionState: (partial) =>
    set((state) => ({ sessionState: { ...state.sessionState, ...partial } })),
  addTrace: (trace) =>
    set((state) => ({ traces: [...state.traces, trace] })),
  setIsExecuting: (isExecuting) => set({ isExecuting }),
  setCurrentAgentId: (currentAgentId) => set({ currentAgentId }),
  setActiveDrawerTab: (activeDrawerTab) => set({ activeDrawerTab }),
  resetAtlas: () =>
    set({
      sessionState: initialSessionState,
      traces: [],
      isExecuting: false,
      currentAgentId: null,
      activeDrawerTab: 'chat',
    }),
}));
