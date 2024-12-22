import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AIConfigState {
  doubaoApiKey: string;
  doubaoModelId: string;
  setDoubaoApiKey: (apiKey: string) => void;
  setDoubaoModelId: (modelId: string) => void;
}

export const useAIConfigStore = create<AIConfigState>()(
  persist(
    (set) => ({
      doubaoApiKey: "",
      doubaoModelId: "",
      setDoubaoApiKey: (apiKey: string) => set({ doubaoApiKey: apiKey }),
      setDoubaoModelId: (modelId: string) => set({ doubaoModelId: modelId }),
    }),
    {
      name: "ai-config-storage",
    }
  )
);
