export const AI_PROVIDERS = [
  "openai",
  "gemini",
  "deepseek",
  "anthropic",
  "qwen",
  "doubao",
] as const;
export type AIProvider = (typeof AI_PROVIDERS)[number];
export type AIProtocol =
  | "chat-completions"
  | "responses"
  | "gemini"
  | "anthropic";

export interface AIConnection {
  provider: AIProvider;
  protocol: AIProtocol;
  apiKey: string;
  model: string;
  baseUrl: string;
}

export interface AIModelProfile extends AIConnection {
  id: string;
  name: string;
  supportsPdf: boolean;
}

export interface AISettingsData {
  models: AIModelProfile[];
  textModelId: string | null;
  pdfModelId: string | null;
}

export interface BuiltinAIModel {
  id: string;
  name: string;
  description: string;
  supportsPdf: boolean;
  recommended?: boolean;
  protocol?: AIProtocol;
}

interface ProviderDefinition {
  name: string;
  baseUrl: string;
  protocol: AIProtocol;
  protocols: readonly AIProtocol[];
  defaultModel: string;
  pdfModel: string;
  keyUrl: string;
}

export const AI_PROVIDER_DEFINITIONS: Record<AIProvider, ProviderDefinition> = {
  openai: {
    name: "OpenAI",
    baseUrl: "https://api.openai.com/v1",
    protocol: "chat-completions",
    protocols: ["chat-completions", "responses"],
    defaultModel: "",
    pdfModel: "",
    keyUrl: "https://platform.openai.com/api-keys",
  },
  qwen: {
    name: "Qwen",
    baseUrl: "https://dashscope.aliyuncs.com/compatible-mode/v1",
    protocol: "chat-completions",
    protocols: ["chat-completions"],
    defaultModel: "qwen3-vl-plus",
    pdfModel: "qwen3-vl-plus",
    keyUrl: "https://bailian.console.aliyun.com",
  },
  doubao: {
    name: "Doubao",
    baseUrl: "https://ark.cn-beijing.volces.com/api/v3",
    protocol: "chat-completions",
    protocols: ["chat-completions"],
    defaultModel: "",
    pdfModel: "",
    keyUrl: "https://console.volcengine.com/ark",
  },
  deepseek: {
    name: "DeepSeek",
    baseUrl: "https://api.deepseek.com/v1",
    protocol: "chat-completions",
    protocols: ["chat-completions"],
    defaultModel: "deepseek-v4-flash",
    pdfModel: "deepseek-v4-flash-vision-exp",
    keyUrl: "https://platform.deepseek.com",
  },
  gemini: {
    name: "Gemini",
    baseUrl: "https://generativelanguage.googleapis.com",
    protocol: "gemini",
    protocols: ["gemini"],
    defaultModel: "gemini-flash-latest",
    pdfModel: "gemini-flash-latest",
    keyUrl: "https://aistudio.google.com/app/apikey",
  },
  anthropic: {
    name: "Claude",
    baseUrl: "https://api.anthropic.com/v1",
    protocol: "anthropic",
    protocols: ["anthropic"],
    defaultModel: "",
    pdfModel: "",
    keyUrl: "https://console.anthropic.com/settings/keys",
  },
};

export const BUILTIN_AI_MODELS: Record<AIProvider, readonly BuiltinAIModel[]> =
  {
    openai: [
      {
        id: "gpt-5.6-sol",
        name: "GPT-5.6 Sol",
        description: "复杂写作与高质量解析",
        supportsPdf: true,
        recommended: true,
        protocol: "responses",
      },
      {
        id: "gpt-5.6-terra",
        name: "GPT-5.6 Terra",
        description: "质量、速度与成本均衡",
        supportsPdf: true,
        protocol: "responses",
      },
      {
        id: "gpt-5.6-luna",
        name: "GPT-5.6 Luna",
        description: "快速、低成本的日常处理",
        supportsPdf: true,
        protocol: "responses",
      },
    ],
    qwen: [
      {
        id: "qwen3.8-max",
        name: "Qwen 3.8 Max",
        description: "旗舰视觉理解与结构化提取",
        supportsPdf: true,
        recommended: true,
      },
      {
        id: "qwen3.7-plus",
        name: "Qwen 3.7 Plus",
        description: "效果与成本均衡",
        supportsPdf: true,
      },
      {
        id: "qwen3.8-flash",
        name: "Qwen 3.8 Flash",
        description: "快速、低成本的批量解析",
        supportsPdf: true,
      },
    ],
    doubao: [
      {
        id: "doubao-seed-2-1-pro-260628",
        name: "Doubao Seed 2.1 Pro",
        description: "复杂文本生成与推理",
        supportsPdf: false,
        recommended: true,
      },
      {
        id: "doubao-seed-2-0-lite-260215",
        name: "Doubao Seed 2.0 Lite",
        description: "快速、低成本的文字处理",
        supportsPdf: false,
      },
      {
        id: "doubao-seed-1-6-vision-250815",
        name: "Doubao Seed 1.6 Vision",
        description: "图片理解与简历解析",
        supportsPdf: true,
      },
    ],
    deepseek: [
      {
        id: "deepseek-v4-pro",
        name: "DeepSeek V4 Pro",
        description: "复杂写作与深度推理",
        supportsPdf: false,
      },
      {
        id: "deepseek-v4-flash",
        name: "DeepSeek V4 Flash",
        description: "快速、低成本的文字处理",
        supportsPdf: false,
        recommended: true,
      },
      {
        id: "deepseek-v4-flash-vision-exp",
        name: "DeepSeek V4 Vision",
        description: "实验性图片理解模型",
        supportsPdf: true,
      },
    ],
    gemini: [
      {
        id: "gemini-3.8-flash",
        name: "Gemini 3.8 Flash",
        description: "高质量多模态处理",
        supportsPdf: true,
        recommended: true,
      },
      {
        id: "gemini-3.1-pro-preview",
        name: "Gemini 3.1 Pro",
        description: "复杂推理与高质量提取",
        supportsPdf: true,
      },
      {
        id: "gemini-3.1-flash-lite",
        name: "Gemini 3.1 Flash-Lite",
        description: "低成本、高吞吐解析",
        supportsPdf: true,
      },
    ],
    anthropic: [
      {
        id: "claude-sonnet-5",
        name: "Claude Sonnet 5",
        description: "质量与速度均衡",
        supportsPdf: true,
        recommended: true,
      },
      {
        id: "claude-opus-5",
        name: "Claude Opus 5",
        description: "复杂任务与高质量理解",
        supportsPdf: true,
      },
      {
        id: "claude-haiku-4-5-20251001",
        name: "Claude Haiku 4.5",
        description: "快速、低成本的日常处理",
        supportsPdf: true,
      },
    ],
  };

export const builtinModelId = (provider: AIProvider, model: string) =>
  `builtin:${provider}:${model}`;

export function createBuiltinModelProfile(
  provider: AIProvider,
  model: BuiltinAIModel,
  apiKey = "",
): AIModelProfile {
  const preset = AI_PROVIDER_DEFINITIONS[provider];
  return {
    id: builtinModelId(provider, model.id),
    provider,
    name: model.name,
    apiKey,
    model: model.id,
    baseUrl: preset.baseUrl,
    protocol: model.protocol ?? preset.protocol,
    supportsPdf: model.supportsPdf,
  };
}

/** Known image-input model families. Unknown custom IDs stay text-only. */
export function modelSupportsPdf(provider: AIProvider, model: string): boolean {
  const id = model.trim().toLowerCase();
  if (!id) return false;
  const builtin = BUILTIN_AI_MODELS[provider].find((item) => item.id === id);
  if (builtin) return builtin.supportsPdf;
  if (provider === "gemini") return !id.includes("embedding");
  if (provider === "anthropic") {
    return /claude-(?:3|4|sonnet-4|opus-4|haiku-4)/.test(id);
  }
  if (provider === "qwen")
    return /(?:qwen.*(?:vl|omni)|(?:vl|omni).*qwen)/.test(id);
  if (provider === "openai") {
    return /gpt-4o|gpt-4\.1|gpt-5|(?:^|[-_.])o[134](?:[-_.]|$)|vision|\bvl\b|multimodal/.test(
      id,
    );
  }
  if (provider === "doubao") {
    return /vision|\bvl\b|doubao.*seed-1[.-][68]/.test(id);
  }
  return /vision|\bvl\b|multimodal/.test(id);
}

export function canModelParsePdf(model: AIModelProfile): boolean {
  return modelSupportsPdf(model.provider, model.model);
}

export function createModelProfile(
  provider: AIProvider,
  id: string,
): AIModelProfile {
  const preset = AI_PROVIDER_DEFINITIONS[provider];
  return {
    id,
    provider,
    name: "",
    apiKey: "",
    model: preset.defaultModel,
    baseUrl: preset.baseUrl,
    protocol: preset.protocol,
    supportsPdf: modelSupportsPdf(provider, preset.defaultModel),
  };
}

export function isValidBaseUrl(value: string): boolean {
  try {
    const url = new URL(value.trim());
    return (
      ["https:", "http:"].includes(url.protocol) &&
      !url.username &&
      !url.password &&
      !url.search &&
      !url.hash
    );
  } catch {
    return false;
  }
}

export function isModelConfigured(
  connection: AIConnection | null | undefined,
): connection is AIConnection {
  return (
    !!connection &&
    !!connection.apiKey.trim() &&
    !!connection.model.trim() &&
    isValidBaseUrl(connection.baseUrl) &&
    AI_PROVIDER_DEFINITIONS[connection.provider].protocols.includes(
      connection.protocol,
    )
  );
}

export function getTaskModel(
  state: AISettingsData,
  task: "text" | "pdf",
): AIModelProfile | null {
  const id = task === "text" ? state.textModelId : state.pdfModelId;
  const profile = state.models.find((item) => item.id === id);
  return profile && (task !== "pdf" || canModelParsePdf(profile))
    ? profile
    : null;
}

export function toAIConnection(profile: AIConnection): AIConnection {
  return {
    provider: profile.provider,
    protocol: profile.protocol,
    apiKey: profile.apiKey.trim(),
    model: profile.model.trim(),
    baseUrl: profile.baseUrl.trim().replace(/\/+$/, ""),
  };
}

export const modelDisplayName = (model: AIModelProfile) =>
  model.name.trim() ||
  model.model ||
  AI_PROVIDER_DEFINITIONS[model.provider].name;
