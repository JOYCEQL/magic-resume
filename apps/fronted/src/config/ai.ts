import { AIModelType } from "@/store/useAIConfigStore";

export interface AIModelConfig {
  url: string;
  requiresModelId: boolean;
  defaultModel?: string;
  headers: (apiKey: string) => Record<string, string>;
}

export const AI_MODEL_CONFIGS: Record<AIModelType, AIModelConfig> = {
  doubao: {
    url: "https://ark.cn-beijing.volces.com/api/v3/chat/completions",
    requiresModelId: true,
    headers: (apiKey: string) => ({
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    }),
  },
  deepseek: {
    url: "https://api.deepseek.com/v1/chat/completions",
    requiresModelId: false,
    defaultModel: "deepseek-chat",
    headers: (apiKey: string) => ({
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    }),
  },
};
