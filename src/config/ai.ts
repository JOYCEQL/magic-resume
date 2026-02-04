export type AIModelType = "doubao" | "deepseek" | "openai";

export interface AIValidationContext {
  doubaoApiKey?: string;
  doubaoModelId?: string;
  deepseekApiKey?: string;
  deepseekModelId?: string;
  openaiApiKey?: string;
  openaiModelId?: string;
  openaiApiEndpoint?: string;
}

export interface AIModelConfig {
  url: (endpoint: string) => string;
  requiresModelId: boolean;
  defaultModel?: string;
  headers: (apiKey: string) => Record<string, string>;
  validate: (context: AIValidationContext) => boolean;
}

export const AI_MODEL_CONFIGS: Record<AIModelType, AIModelConfig> = {
  doubao: {
    url: (endpoint: string) => "https://ark.cn-beijing.volces.com/api/v3/chat/completions",
    requiresModelId: true,
    headers: (apiKey: string) => ({
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    }),
    validate: (context: AIValidationContext) => !!(context.doubaoApiKey && context.doubaoModelId),
  },
  deepseek: {
    url: (endpoint: string) => "https://api.deepseek.com/v1/chat/completions",
    requiresModelId: false,
    defaultModel: "deepseek-chat",
    headers: (apiKey: string) => ({
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    }),
    validate: (context: AIValidationContext) =>
      context.deepseekModelId
      // If requiresModelId is false (for deepseek it is), we usually just check apiKey?
      // But looking at previous store logic:
      // requiredModelId ? (apiKey && modelId) : apiKey
      // For deepseek config above, requiresModelId is false.
      // So logic should be !!context.deepseekApiKey
      // BUT, in your previous store code:
      //  config.requiresModelId ? !!(state.deepseekApiKey && state.deepseekModelId) : !!state.deepseekApiKey
      // Deepseek config has requiresModelId: false.
      // So it returns !!state.deepseekApiKey.
      // Wait, let's make it generic based on its own config if possible, or just hardcode specific logic.
      // Since we are inside the specific config, we know logic.
      ? !!(context.deepseekApiKey && context.deepseekModelId)
      : !!context.deepseekApiKey,
  },
  openai: {
    url: (endpoint: string) => `${endpoint}/chat/completions`,
    requiresModelId: true,
    headers: (apiKey: string) => ({
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    }),
    validate: (context: AIValidationContext) => !!(context.openaiApiKey && context.openaiModelId && context.openaiApiEndpoint),
  }
};
