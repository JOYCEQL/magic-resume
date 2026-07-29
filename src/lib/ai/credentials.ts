import { AI_MODEL_CONFIGS, AIModelType } from "@/config/ai";

export interface AIProviderCredentials {
  modelType: AIModelType;
  apiKey: string;
  model: string;
  apiEndpoint?: string;
}

/** Minimal store slice needed to resolve the active provider request config. */
export interface AIConfigCredentialSource {
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
}

/**
 * Resolve apiKey / model / endpoint for the currently selected provider.
 * Centralizes the nested switches used by grammar check and polish flows.
 */
export const resolveActiveProviderCredentials = (
  state: AIConfigCredentialSource
): AIProviderCredentials => {
  const modelType = state.selectedModel;
  const config = AI_MODEL_CONFIGS[modelType];

  switch (modelType) {
    case "doubao":
      return {
        modelType,
        apiKey: state.doubaoApiKey,
        model: state.doubaoModelId,
      };
    case "deepseek":
      return {
        modelType,
        apiKey: state.deepseekApiKey,
        model: state.deepseekModelId || config.defaultModel || "deepseek-v4-flash",
      };
    case "openai":
      return {
        modelType,
        apiKey: state.openaiApiKey,
        model: state.openaiModelId,
        apiEndpoint: state.openaiApiEndpoint,
      };
    case "gemini":
      return {
        modelType,
        apiKey: state.geminiApiKey,
        model: state.geminiModelId || config.defaultModel || "gemini-flash-latest",
      };
    case "claude":
      return {
        modelType,
        apiKey: state.claudeApiKey,
        model: state.claudeModelId || config.defaultModel || "claude-sonnet-5",
        apiEndpoint:
          state.claudeApiEndpoint?.trim() || config.defaultEndpoint,
      };
    case "grok":
      return {
        modelType,
        apiKey: state.grokApiKey,
        model: state.grokModelId || config.defaultModel || "grok-4.5",
        apiEndpoint: state.grokApiEndpoint?.trim() || config.defaultEndpoint,
      };
    default: {
      const _exhaustive: never = modelType;
      throw new Error(`Unsupported model type: ${_exhaustive}`);
    }
  }
};
