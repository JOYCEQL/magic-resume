export type AIModelType =
  | "doubao"
  | "deepseek"
  | "openai"
  | "gemini"
  | "claude"
  | "grok";

/** Upstream wire format used by server-side adapters. */
export type AIApiFormat = "openai_chat" | "gemini" | "anthropic";

export interface AIValidationContext {
  doubaoApiKey?: string;
  doubaoModelId?: string;
  deepseekApiKey?: string;
  deepseekModelId?: string;
  openaiApiKey?: string;
  openaiModelId?: string;
  openaiApiEndpoint?: string;
  geminiApiKey?: string;
  geminiModelId?: string;
  claudeApiKey?: string;
  claudeModelId?: string;
  claudeApiEndpoint?: string;
  grokApiKey?: string;
  grokModelId?: string;
  grokApiEndpoint?: string;
}

export interface AIModelConfig {
  apiFormat: AIApiFormat;
  /** Build the full request URL. Optional endpoint supports custom proxies/gateways. */
  url: (endpoint?: string) => string;
  requiresModelId: boolean;
  /** Whether the settings UI should show an endpoint field. */
  allowsCustomEndpoint: boolean;
  defaultEndpoint?: string;
  defaultModel?: string;
  headers: (apiKey: string) => Record<string, string>;
  validate: (context: AIValidationContext) => boolean;
}

const normalizeBase = (endpoint: string) => endpoint.trim().replace(/\/+$/, "");

const openAICompatibleUrl = (endpoint: string, fallback: string) => {
  const base = normalizeBase(endpoint || fallback);
  return `${base}/chat/completions`;
};

const anthropicMessagesUrl = (endpoint?: string) => {
  const base = normalizeBase(endpoint || "https://api.anthropic.com");
  if (base.endsWith("/v1")) {
    return `${base}/messages`;
  }
  if (base.endsWith("/messages")) {
    return base;
  }
  return `${base}/v1/messages`;
};

export const AI_MODEL_CONFIGS: Record<AIModelType, AIModelConfig> = {
  doubao: {
    apiFormat: "openai_chat",
    url: () => "https://ark.cn-beijing.volces.com/api/v3/chat/completions",
    requiresModelId: true,
    allowsCustomEndpoint: false,
    headers: (apiKey: string) => ({
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    }),
    validate: (context: AIValidationContext) =>
      !!(context.doubaoApiKey && context.doubaoModelId),
  },
  deepseek: {
    apiFormat: "openai_chat",
    url: () => "https://api.deepseek.com/v1/chat/completions",
    requiresModelId: false,
    allowsCustomEndpoint: false,
    defaultModel: "deepseek-chat",
    headers: (apiKey: string) => ({
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    }),
    validate: (context: AIValidationContext) => !!context.deepseekApiKey,
  },
  openai: {
    apiFormat: "openai_chat",
    url: (endpoint?: string) =>
      openAICompatibleUrl(endpoint || "", ""),
    requiresModelId: true,
    allowsCustomEndpoint: true,
    headers: (apiKey: string) => ({
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    }),
    validate: (context: AIValidationContext) =>
      !!(
        context.openaiApiKey &&
        context.openaiModelId &&
        context.openaiApiEndpoint
      ),
  },
  gemini: {
    apiFormat: "gemini",
    url: () => "https://generativelanguage.googleapis.com/v1beta",
    requiresModelId: true,
    allowsCustomEndpoint: false,
    defaultModel: "gemini-flash-latest",
    headers: (apiKey: string) => ({
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey,
    }),
    validate: (context: AIValidationContext) =>
      !!(context.geminiApiKey && context.geminiModelId),
  },
  claude: {
    apiFormat: "anthropic",
    url: anthropicMessagesUrl,
    requiresModelId: true,
    allowsCustomEndpoint: true,
    defaultEndpoint: "https://api.anthropic.com",
    defaultModel: "claude-sonnet-4-20250514",
    headers: (apiKey: string) => ({
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    }),
    validate: (context: AIValidationContext) =>
      !!(context.claudeApiKey && context.claudeModelId),
  },
  grok: {
    apiFormat: "openai_chat",
    url: (endpoint?: string) =>
      openAICompatibleUrl(endpoint || "", "https://api.x.ai/v1"),
    requiresModelId: true,
    allowsCustomEndpoint: true,
    defaultEndpoint: "https://api.x.ai/v1",
    defaultModel: "grok-3",
    headers: (apiKey: string) => ({
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    }),
    validate: (context: AIValidationContext) =>
      !!(context.grokApiKey && context.grokModelId),
  },
};

export const AI_MODEL_TYPES = Object.keys(AI_MODEL_CONFIGS) as AIModelType[];
