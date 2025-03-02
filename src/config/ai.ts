import { AIModelType } from "@/store/useAIConfigStore";

export interface AIModelConfig {
  url: string;
  requiresModelId: boolean;
  defaultModel?: string;
  headers: (apiKey: string) => Record<string, string>;
}

export const AI_MODEL_CONFIGS: Record<AIModelType, AIModelConfig> = {
  // 豆包模型配置
  doubao: {
    url: "https://ark.cn-beijing.volces.com/api/v3/chat/completions",
    requiresModelId: true,
    headers: (apiKey: string) => ({
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    }),
  },

  // DeepSeek 模型配置
  deepseek: {
    url: "https://api.deepseek.com/v1/chat/completions",
    requiresModelId: false,
    defaultModel: "deepseek-chat",
    headers: (apiKey: string) => ({
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    }),
  },

  // 新增自定义服务商配置
  custom: {
    url: "", // 由用户输入动态提供
    requiresModelId: true,
    headers: (apiKey: string) => ({
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    }),
  },
};
