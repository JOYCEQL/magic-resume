import { orcaModelSupportsImages } from "./orcarouter";

export const AI_PROVIDERS = [
  "openai",
  "gemini",
  "deepseek",
  "anthropic",
  "qwen",
  "doubao",
  "orcarouter",
] as const;
export type AIProvider = (typeof AI_PROVIDERS)[number];
export type AIProtocol =
  | "chat-completions"
  | "responses"
  | "gemini"
  | "anthropic";

/**
 * Providers accepting more than a pasted API key carry the credential source
 * on the model profile instead of inventing a second provider entry: the
 * repository shares one credential per provider.
 */
export type AIAuthMethod = "api-key" | "oauth";
export const AI_AUTH_METHODS = ["api-key", "oauth"] as const;

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
  /** Only meaningful for providers listed in AUTH_METHOD_PROVIDERS. */
  authMethod?: AIAuthMethod;
  /** Monotonic credential generation; protects reauthentication from stale failures. */
  generation?: number;
  /** Set when OrcaRouter refused this exact credential generation. */
  needsReauth?: boolean;
}

export interface AISettingsData {
  models: AIModelProfile[];
  textModelId: string | null;
  pdfModelId: string | null;
}

export interface BuiltinAIModel {
  id: string;
  name: string;
  descriptionKey: string;
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
  /** Providers offering a sign-in flow next to the pasted API key. */
  authMethods?: readonly AIAuthMethod[];
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
  orcarouter: {
    name: "OrcaRouter",
    baseUrl: "https://api.orcarouter.ai/v1",
    protocol: "chat-completions",
    protocols: ["chat-completions"],
    defaultModel: "orcarouter/auto",
    pdfModel: "",
    keyUrl: "https://www.orcarouter.ai/console/authorized-apps",
    authMethods: ["api-key", "oauth"],
  },
};

export const BUILTIN_AI_MODELS: Record<AIProvider, readonly BuiltinAIModel[]> =
  {
    openai: [
      {
        id: "gpt-5.6-sol",
        name: "GPT-5.6 Sol",
        descriptionKey: "modelDescriptions.writingAndParsing",
        supportsPdf: true,
        recommended: true,
        protocol: "responses",
      },
      {
        id: "gpt-5.6-terra",
        name: "GPT-5.6 Terra",
        descriptionKey: "modelDescriptions.balancedQualitySpeedCost",
        supportsPdf: true,
        protocol: "responses",
      },
      {
        id: "gpt-5.6-luna",
        name: "GPT-5.6 Luna",
        descriptionKey: "modelDescriptions.fastEveryday",
        supportsPdf: true,
        protocol: "responses",
      },
    ],
    qwen: [
      {
        id: "qwen3.8-max",
        name: "Qwen 3.8 Max",
        descriptionKey: "modelDescriptions.flagshipVision",
        supportsPdf: true,
        recommended: true,
      },
      {
        id: "qwen3.7-plus",
        name: "Qwen 3.7 Plus",
        descriptionKey: "modelDescriptions.balancedQualityCost",
        supportsPdf: true,
      },
      {
        id: "qwen3.8-flash",
        name: "Qwen 3.8 Flash",
        descriptionKey: "modelDescriptions.fastBatchParsing",
        supportsPdf: true,
      },
    ],
    doubao: [
      {
        id: "doubao-seed-2-1-pro-260628",
        name: "Doubao Seed 2.1 Pro",
        descriptionKey: "modelDescriptions.textAndReasoning",
        supportsPdf: false,
        recommended: true,
      },
      {
        id: "doubao-seed-2-0-lite-260215",
        name: "Doubao Seed 2.0 Lite",
        descriptionKey: "modelDescriptions.fastText",
        supportsPdf: false,
      },
      {
        id: "doubao-seed-1-6-vision-250815",
        name: "Doubao Seed 1.6 Vision",
        descriptionKey: "modelDescriptions.visionAndResume",
        supportsPdf: true,
      },
    ],
    deepseek: [
      {
        id: "deepseek-v4-pro",
        name: "DeepSeek V4 Pro",
        descriptionKey: "modelDescriptions.writingAndReasoning",
        supportsPdf: false,
      },
      {
        id: "deepseek-v4-flash",
        name: "DeepSeek V4 Flash",
        descriptionKey: "modelDescriptions.fastText",
        supportsPdf: false,
        recommended: true,
      },
      {
        id: "deepseek-v4-flash-vision-exp",
        name: "DeepSeek V4 Vision",
        descriptionKey: "modelDescriptions.experimentalVision",
        supportsPdf: true,
      },
    ],
    gemini: [
      {
        id: "gemini-3.8-flash",
        name: "Gemini 3.8 Flash",
        descriptionKey: "modelDescriptions.multimodal",
        supportsPdf: true,
        recommended: true,
      },
      {
        id: "gemini-3.1-pro-preview",
        name: "Gemini 3.1 Pro",
        descriptionKey: "modelDescriptions.reasoningAndExtraction",
        supportsPdf: true,
      },
      {
        id: "gemini-3.1-flash-lite",
        name: "Gemini 3.1 Flash-Lite",
        descriptionKey: "modelDescriptions.highThroughput",
        supportsPdf: true,
      },
    ],
    anthropic: [
      {
        id: "claude-sonnet-5",
        name: "Claude Sonnet 5",
        descriptionKey: "modelDescriptions.balancedQualitySpeed",
        supportsPdf: true,
        recommended: true,
      },
      {
        id: "claude-opus-5",
        name: "Claude Opus 5",
        descriptionKey: "modelDescriptions.complexUnderstanding",
        supportsPdf: true,
      },
      {
        id: "claude-haiku-4-5-20251001",
        name: "Claude Haiku 4.5",
        descriptionKey: "modelDescriptions.fastEveryday",
        supportsPdf: true,
      },
    ],
    /**
     * Cold-start / outage seed only. Live discovery through
     * `GET {baseUrl}/models` is authoritative and replaces this list
     * completely; nothing here is merged into a successful live result.
     */
    orcarouter: [
      {
        id: "openai/gpt-5.5",
        name: "GPT-5.5",
        descriptionKey: "modelDescriptions.writingAndReasoning",
        supportsPdf: false,
        recommended: true,
      },
      {
        id: "anthropic/claude-opus-4.8",
        name: "Claude Opus 4.8",
        descriptionKey: "modelDescriptions.complexUnderstanding",
        supportsPdf: true,
      },
      {
        id: "google/gemini-3.5-flash",
        name: "Gemini 3.5 Flash",
        descriptionKey: "modelDescriptions.multimodal",
        supportsPdf: true,
      },
      {
        id: "deepseek/deepseek-v4-pro",
        name: "DeepSeek V4 Pro",
        descriptionKey: "modelDescriptions.writingAndParsing",
        supportsPdf: false,
      },
      {
        id: "orcarouter/auto",
        name: "OrcaRouter Auto",
        descriptionKey: "modelDescriptions.balancedQualityCost",
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
  // OrcaRouter capabilities come from its catalog metadata only.
  if (provider === "orcarouter") return orcaModelSupportsImages(model);
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
  if (!profile || profile.needsReauth) return null;
  return task !== "pdf" || canModelParsePdf(profile) ? profile : null;
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

export const providerAuthMethods = (
  provider: AIProvider,
): readonly AIAuthMethod[] =>
  AI_PROVIDER_DEFINITIONS[provider].authMethods ?? ["api-key"];

export const supportsAuthMethod = (
  provider: AIProvider,
  method: AIAuthMethod,
) => providerAuthMethods(provider).includes(method);

/** Both OrcaRouter entries share one credential and one inference adapter. */
export const profileAuthMethod = (
  profile: Pick<AIModelProfile, "provider" | "authMethod">,
): AIAuthMethod => {
  const method = profile.authMethod ?? "api-key";
  return supportsAuthMethod(profile.provider, method) ? method : "api-key";
};

/** Any separately displayed entry of the same provider owns the same credential. */
export const sharesCredential = (
  a: Pick<AIModelProfile, "provider">,
  b: Pick<AIModelProfile, "provider">,
) => a.provider === b.provider;

