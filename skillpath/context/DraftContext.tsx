'use client';
// updated

import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

interface DraftState {
  jd?: string;
  resumeText?: string;
}

interface DraftContextValue {
  draft: DraftState;
  setDraft: (draft: DraftState) => void;
  clearDraft: () => void;
}

const DraftContext = createContext<DraftContextValue | null>(null);

export function DraftProvider({ children }: { children: ReactNode }) {
  const [draft, setDraft] = useState<DraftState>({});
  const value = useMemo(() => ({
    draft,
    setDraft,
    clearDraft: () => setDraft({}),
  }), [draft]);

  return <DraftContext.Provider value={value}>{children}</DraftContext.Provider>;
}

export function useDraft() {
  const value = useContext(DraftContext);
  if (!value) throw new Error('useDraft must be used inside DraftProvider');
  return value;
}
