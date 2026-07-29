import { create } from "zustand";
import { persist } from "zustand/middleware";
import { AI_MODEL_CONFIGS, AIModelType } from "@/config/ai";

interface AIConfigState {
  selectedModel: AIModelType;
  doubaoApiKey: string;
  doubaoModelId: string;
  deepseekApiKey: string;
  deepseekModelId: string;
  openaiApiKey: string;
  openaiModelId: string;
  openaiApiEndpoint: string;
  geminiApiKey: string;
  geminiModelId: string;
  claudeApiKey: string;
  claudeModelId: string;
  claudeApiEndpoint: string;
  grokApiKey: string;
  grokModelId: string;
  grokApiEndpoint: string;
  setSelectedModel: (model: AIModelType) => void;
  setDoubaoApiKey: (apiKey: string) => void;
  setDoubaoModelId: (modelId: string) => void;
  setDeepseekApiKey: (apiKey: string) => void;
  setDeepseekModelId: (modelId: string) => void;
  setOpenaiApiKey: (apiKey: string) => void;
  setOpenaiModelId: (modelId: string) => void;
  setOpenaiApiEndpoint: (endpoint: string) => void;
  setGeminiApiKey: (apiKey: string) => void;
  setGeminiModelId: (modelId: string) => void;
  setClaudeApiKey: (apiKey: string) => void;
  setClaudeModelId: (modelId: string) => void;
  setClaudeApiEndpoint: (endpoint: string) => void;
  setGrokApiKey: (apiKey: string) => void;
  setGrokModelId: (modelId: string) => void;
  setGrokApiEndpoint: (endpoint: string) => void;
  isConfigured: () => boolean;
}

export const useAIConfigStore = create<AIConfigState>()(
  persist(
    (set, get) => ({
      selectedModel: "doubao",
      doubaoApiKey: "",
      doubaoModelId: "",
      deepseekApiKey: "",
      deepseekModelId: "",
      openaiApiKey: "",
      openaiModelId: "",
      openaiApiEndpoint: "",
      geminiApiKey: "",
      geminiModelId: "gemini-flash-latest",
      claudeApiKey: "",
      claudeModelId: "claude-sonnet-5",
      claudeApiEndpoint: "https://api.anthropic.com",
      grokApiKey: "",
      grokModelId: "grok-4.5",
      grokApiEndpoint: "https://api.x.ai/v1",
      setSelectedModel: (model: AIModelType) => set({ selectedModel: model }),
      setDoubaoApiKey: (apiKey: string) => set({ doubaoApiKey: apiKey }),
      setDoubaoModelId: (modelId: string) => set({ doubaoModelId: modelId }),
      setDeepseekApiKey: (apiKey: string) => set({ deepseekApiKey: apiKey }),
      setDeepseekModelId: (modelId: string) => set({ deepseekModelId: modelId }),
      setOpenaiApiKey: (apiKey: string) => set({ openaiApiKey: apiKey }),
      setOpenaiModelId: (modelId: string) => set({ openaiModelId: modelId }),
      setOpenaiApiEndpoint: (endpoint: string) =>
        set({ openaiApiEndpoint: endpoint }),
      setGeminiApiKey: (apiKey: string) => set({ geminiApiKey: apiKey }),
      setGeminiModelId: (modelId: string) => set({ geminiModelId: modelId }),
      setClaudeApiKey: (apiKey: string) => set({ claudeApiKey: apiKey }),
      setClaudeModelId: (modelId: string) => set({ claudeModelId: modelId }),
      setClaudeApiEndpoint: (endpoint: string) =>
        set({ claudeApiEndpoint: endpoint }),
      setGrokApiKey: (apiKey: string) => set({ grokApiKey: apiKey }),
      setGrokModelId: (modelId: string) => set({ grokModelId: modelId }),
      setGrokApiEndpoint: (endpoint: string) => set({ grokApiEndpoint: endpoint }),
      isConfigured: () => {
        const state = get();
        const config = AI_MODEL_CONFIGS[state.selectedModel];
        return config.validate(state);
      },
    }),
    {
      name: "ai-config-storage",
    }
  )
);
