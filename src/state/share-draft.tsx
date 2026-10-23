import { createContext, use, useCallback, useMemo, useState, type ReactNode } from 'react';

import type { TransmissionOrigin } from '@/types/transmission';

/**
 * Re-broadcast prefill lives in memory rather than in route params, so an
 * external deep link can't inject text into the Share screen.
 */
export type ShareDraft = { payload: string; origin: TransmissionOrigin };

type ShareDraftContextValue = {
  draft: ShareDraft | null;
  setDraft: (draft: ShareDraft) => void;
  clearDraft: () => void;
};

const ShareDraftContext = createContext<ShareDraftContextValue | null>(null);

export function ShareDraftProvider({ children }: { children: ReactNode }) {
  const [draft, setDraftState] = useState<ShareDraft | null>(null);
  const setDraft = useCallback((next: ShareDraft) => setDraftState(next), []);
  const clearDraft = useCallback(() => setDraftState(null), []);
  const value = useMemo(() => ({ draft, setDraft, clearDraft }), [draft, setDraft, clearDraft]);
  return <ShareDraftContext value={value}>{children}</ShareDraftContext>;
}

export function useShareDraft(): ShareDraftContextValue {
  const context = use(ShareDraftContext);
  if (!context) throw new Error('useShareDraft must be used inside ShareDraftProvider');
  return context;
}
