import { create } from "zustand";
import { persist } from "zustand/middleware";

export type AIModelType = "doubao" | "deepseek" | "custom";

interface AIConfigState {
  // 模型选择状态
  selectedModel: AIModelType;
  
  // 豆包模型配置
  doubaoApiKey: string;
  doubaoModelId: string;
  
  // DeepSeek 模型配置
  deepseekApiKey: string;
  deepseekModelId: string;
  
  // 自定义服务商配置
  customApiKey: string;
  customBaseURL: string;
  customModelId: string;

  // 模型选择方法
  setSelectedModel: (model: AIModelType) => void;
  
  // 豆包配置方法
  setDoubaoApiKey: (apiKey: string) => void;
  setDoubaoModelId: (modelId: string) => void;
  
  // DeepSeek 配置方法
  setDeepseekApiKey: (apiKey: string) => void;
  setDeepseekModelId: (modelId: string) => void;
  
  // 自定义服务商配置方法
  setCustomApiKey: (apiKey: string) => void;
  setCustomBaseURL: (baseURL: string) => void;
  setCustomModelId: (modelId: string) => void;
}

export const useAIConfigStore = create<AIConfigState>()(
  persist(
    (set) => ({
      // 初始状态
      selectedModel: "doubao",
      
      // 豆包初始配置
      doubaoApiKey: "",
      doubaoModelId: "",
      
      // DeepSeek 初始配置
      deepseekApiKey: "",
      deepseekModelId: "",
      
      // 自定义服务商初始配置
      customApiKey: "",
      customBaseURL: "",
      customModelId: "",

      // 状态更新方法
      setSelectedModel: (model) => set({ selectedModel: model }),
      
      setDoubaoApiKey: (apiKey) => set({ doubaoApiKey: apiKey }),
      setDoubaoModelId: (modelId) => set({ doubaoModelId: modelId }),
      
      setDeepseekApiKey: (apiKey) => set({ deepseekApiKey: apiKey }),
      setDeepseekModelId: (modelId) => set({ deepseekModelId: modelId }),
      
      setCustomApiKey: (apiKey) => set({ customApiKey: apiKey }),
      setCustomBaseURL: (baseURL) => set({ customBaseURL: baseURL }),
      setCustomModelId: (modelId) => set({ customModelId: modelId })
    }),
    {
      name: "ai-config-storage", // 本地存储名称
      partialize: (state) => ({
        // 选择需要持久化的状态
        selectedModel: state.selectedModel,
        doubaoApiKey: state.doubaoApiKey,
        doubaoModelId: state.doubaoModelId,
        deepseekApiKey: state.deepseekApiKey,
        deepseekModelId: state.deepseekModelId,
        customApiKey: state.customApiKey,
        customBaseURL: state.customBaseURL,
        customModelId: state.customModelId
      })
    }
  )
);

// 类型导出（用于其他文件）
export type { AIConfigState };
