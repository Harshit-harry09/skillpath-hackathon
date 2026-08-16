import { create } from 'zustand';

export type ActiveModalType =
  | null
  | 'cover-letter'
  | 'linkedin-headline'
  | 'star-bullets'
  | 'deslopify'
  | 'resume-flaws'
  | 'self-assessment'
  | 'metric-discovery';

interface ResultsState {
  activeModal: ActiveModalType;
  selectedSkill: string | null;
  activeRoleFilter: string;
  isGeneratingAll: boolean;

  // Actions
  openModal: (modal: ActiveModalType, skill?: string | null) => void;
  closeModal: () => void;
  setActiveRoleFilter: (role: string) => void;
  setIsGeneratingAll: (generating: boolean) => void;
}

export const useResultsStore = create<ResultsState>((set) => ({
  activeModal: null,
  selectedSkill: null,
  activeRoleFilter: 'all',
  isGeneratingAll: false,

  openModal: (activeModal, selectedSkill = null) => set({ activeModal, selectedSkill }),
  closeModal: () => set({ activeModal: null, selectedSkill: null }),
  setActiveRoleFilter: (activeRoleFilter) => set({ activeRoleFilter }),
  setIsGeneratingAll: (isGeneratingAll) => set({ isGeneratingAll }),
}));
