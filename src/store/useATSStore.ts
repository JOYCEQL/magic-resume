import { create } from "zustand";

export interface ATSSectionResult {
  score: number;
  summary: string;
  suggestions: string[];
}

export interface ATSResult {
  overall: number;
  language?: string;
  sections: Record<string, ATSSectionResult>;
  analyzedAt: number;
  resumeId: string;
}

interface ATSState {
  panelOpen: boolean;
  isAnalyzing: boolean;
  error: string | null;
  resultsByResume: Record<string, ATSResult>;
  openPanel: () => void;
  closePanel: () => void;
  togglePanel: () => void;
  setAnalyzing: (v: boolean) => void;
  setError: (msg: string | null) => void;
  setResult: (resumeId: string, result: Omit<ATSResult, "analyzedAt" | "resumeId">) => void;
  getResult: (resumeId: string | undefined) => ATSResult | null;
  clearResult: (resumeId: string) => void;
}

export const useATSStore = create<ATSState>()((set, get) => ({
  panelOpen: false,
  isAnalyzing: false,
  error: null,
  resultsByResume: {},
  openPanel: () => set({ panelOpen: true }),
  closePanel: () => set({ panelOpen: false }),
  togglePanel: () => set((s) => ({ panelOpen: !s.panelOpen })),
  setAnalyzing: (v) => set({ isAnalyzing: v, error: v ? null : get().error }),
  setError: (msg) => set({ error: msg, isAnalyzing: false }),
  setResult: (resumeId, result) =>
    set((s) => ({
      isAnalyzing: false,
      error: null,
      resultsByResume: {
        ...s.resultsByResume,
        [resumeId]: { ...result, analyzedAt: Date.now(), resumeId }
      }
    })),
  getResult: (resumeId) => (resumeId ? get().resultsByResume[resumeId] ?? null : null),
  clearResult: (resumeId) =>
    set((s) => {
      const next = { ...s.resultsByResume };
      delete next[resumeId];
      return { resultsByResume: next };
    })
}));
