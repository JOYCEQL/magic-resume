import { useEffect, useState, type ComponentType, type ChangeEvent } from "react";
import { Check, ExternalLink, Sparkles } from "lucide-react";
import { useTranslations } from "@/i18n/compat/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import DeepSeekLogo from "@/components/ai/icon/IconDeepseek";
import IconDoubao from "@/components/ai/icon/IconDoubao";
import IconClaude from "@/components/ai/icon/IconClaude";
import IconGrok from "@/components/ai/icon/IconGrok";
import IconOpenAi from "@/components/ai/icon/IconOpenAi";
import { useAIConfigStore } from "@/store/useAIConfigStore";
import { AIModelType, AI_MODEL_CONFIGS } from "@/config/ai";
import { cn } from "@/lib/utils";

const AISettingsPage = () => {
  const {
    doubaoApiKey,
    doubaoModelId,
    deepseekApiKey,
    openaiApiKey,
    openaiModelId,
    openaiApiEndpoint,
    geminiApiKey,
    geminiModelId,
    claudeApiKey,
    claudeModelId,
    claudeApiEndpoint,
    grokApiKey,
    grokModelId,
    grokApiEndpoint,
    setDoubaoApiKey,
    setDoubaoModelId,
    setDeepseekApiKey,
    setOpenaiApiKey,
    setOpenaiModelId,
    setOpenaiApiEndpoint,
    setGeminiApiKey,
    setGeminiModelId,
    setClaudeApiKey,
    setClaudeModelId,
    setClaudeApiEndpoint,
    setGrokApiKey,
    setGrokModelId,
    setGrokApiEndpoint,
    selectedModel,
    setSelectedModel,
  } = useAIConfigStore();
  const [currentModel, setCurrentModel] = useState<AIModelType>(selectedModel);

  const t = useTranslations();

  useEffect(() => {
    setCurrentModel(selectedModel);
  }, [selectedModel]);

  const handleApiKeyChange = (
    e: ChangeEvent<HTMLInputElement>,
    type: AIModelType
  ) => {
    const newApiKey = e.target.value;
    switch (type) {
      case "doubao":
        setDoubaoApiKey(newApiKey);
        break;
      case "deepseek":
        setDeepseekApiKey(newApiKey);
        break;
      case "openai":
        setOpenaiApiKey(newApiKey);
        break;
      case "gemini":
        setGeminiApiKey(newApiKey);
        break;
      case "claude":
        setClaudeApiKey(newApiKey);
        break;
      case "grok":
        setGrokApiKey(newApiKey);
        break;
    }
  };

  const handleModelIdChange = (
    e: ChangeEvent<HTMLInputElement>,
    type: AIModelType
  ) => {
    const newModelId = e.target.value;
    switch (type) {
      case "doubao":
        setDoubaoModelId(newModelId);
        break;
      case "openai":
        setOpenaiModelId(newModelId);
        break;
      case "gemini":
        setGeminiModelId(newModelId);
        break;
      case "claude":
        setClaudeModelId(newModelId);
        break;
      case "grok":
        setGrokModelId(newModelId);
        break;
      case "deepseek":
        break;
    }
  };

  const handleApiEndpointChange = (
    e: ChangeEvent<HTMLInputElement>,
    type: AIModelType
  ) => {
    const newApiEndpoint = e.target.value;
    switch (type) {
      case "openai":
        setOpenaiApiEndpoint(newApiEndpoint);
        break;
      case "claude":
        setClaudeApiEndpoint(newApiEndpoint);
        break;
      case "grok":
        setGrokApiEndpoint(newApiEndpoint);
        break;
      default:
        break;
    }
  };

  const getApiKeyValue = (id: AIModelType) => {
    switch (id) {
      case "doubao":
        return doubaoApiKey;
      case "deepseek":
        return deepseekApiKey;
      case "openai":
        return openaiApiKey;
      case "gemini":
        return geminiApiKey;
      case "claude":
        return claudeApiKey;
      case "grok":
        return grokApiKey;
    }
  };

  const getModelIdValue = (id: AIModelType) => {
    switch (id) {
      case "doubao":
        return doubaoModelId;
      case "openai":
        return openaiModelId;
      case "gemini":
        return geminiModelId;
      case "claude":
        return claudeModelId;
      case "grok":
        return grokModelId;
      case "deepseek":
        return "";
    }
  };

  const getEndpointValue = (id: AIModelType) => {
    switch (id) {
      case "openai":
        return openaiApiEndpoint;
      case "claude":
        return claudeApiEndpoint;
      case "grok":
        return grokApiEndpoint;
      default:
        return "";
    }
  };

  const models: Array<{
    id: AIModelType;
    name: string;
    description: string;
    icon: ComponentType<{ className?: string }>;
    link: string;
    color: string;
    isConfigured: boolean;
    showModelId: boolean;
  }> = [
    {
      id: "deepseek",
      name: t("dashboard.settings.ai.deepseek.title"),
      description: t("dashboard.settings.ai.deepseek.description"),
      icon: DeepSeekLogo,
      link: "https://platform.deepseek.com",
      color: "text-purple-500",
      isConfigured: !!deepseekApiKey,
      showModelId: false,
    },
    {
      id: "doubao",
      name: t("dashboard.settings.ai.doubao.title"),
      description: t("dashboard.settings.ai.doubao.description"),
      icon: IconDoubao,
      link: "https://console.volcengine.com/ark",
      color: "text-blue-500",
      isConfigured: !!(doubaoApiKey && doubaoModelId),
      showModelId: true,
    },
    {
      id: "openai",
      name: t("dashboard.settings.ai.openai.title"),
      description: t("dashboard.settings.ai.openai.description"),
      icon: IconOpenAi,
      link: "https://platform.openai.com/api-keys",
      color: "text-blue-500",
      isConfigured: !!(openaiApiKey && openaiModelId && openaiApiEndpoint),
      showModelId: true,
    },
    {
      id: "gemini",
      name: t("dashboard.settings.ai.gemini.title"),
      description: t("dashboard.settings.ai.gemini.description"),
      icon: Sparkles,
      link: "https://aistudio.google.com/app/apikey",
      color: "text-amber-500",
      isConfigured: !!(geminiApiKey && geminiModelId),
      showModelId: true,
    },
    {
      id: "claude",
      name: t("dashboard.settings.ai.claude.title"),
      description: t("dashboard.settings.ai.claude.description"),
      icon: IconClaude,
      link: "https://console.anthropic.com/settings/keys",
      color: "text-orange-500",
      isConfigured: !!(claudeApiKey && claudeModelId),
      showModelId: true,
    },
    {
      id: "grok",
      name: t("dashboard.settings.ai.grok.title"),
      description: t("dashboard.settings.ai.grok.description"),
      icon: IconGrok,
      link: "https://console.x.ai",
      color: "text-neutral-800 dark:text-neutral-100",
      isConfigured: !!(grokApiKey && grokModelId),
      showModelId: true,
    },
  ];

  return (
    <div className="mx-auto py-4 px-4">
      <div className="flex gap-8">
        <div className="w-64 space-y-6">
          <div className="flex flex-col space-y-1">
            {models.map((model) => {
              const Icon = model.icon;
              const isChecked = selectedModel === model.id;
              const isViewing = currentModel === model.id;
              return (
                <div
                  key={model.id}
                  onClick={() => {
                    setCurrentModel(model.id);
                  }}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left border",
                    "transition-all duration-200 cursor-pointer",
                    "hover:bg-primary/10 hover:border-primary/30",
                    isViewing
                      ? "bg-primary/10 border-primary/40"
                      : "border-transparent"
                  )}
                >
                  <div
                    className={cn(
                      "shrink-0",
                      isViewing ? "text-primary" : "text-muted-foreground"
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col items-start">
                    <span
                      className={cn(
                        "font-medium text-sm",
                        isViewing && "text-primary"
                      )}
                    >
                      {model.name}
                    </span>
                    <span className="text-xs text-muted-foreground truncate w-full">
                      {model.isConfigured
                        ? t("common.configured")
                        : t("common.notConfigured")}
                    </span>
                  </div>
                  <button
                    type="button"
                    aria-label={`Select ${model.name}`}
                    onClick={() => {
                      setSelectedModel(model.id);
                      setCurrentModel(model.id);
                    }}
                    className={cn(
                      "h-6 w-6 rounded-md flex items-center justify-center border transition-all",
                      "shrink-0",
                      isChecked
                        ? "bg-primary border-primary text-primary-foreground"
                        : "bg-transparent border-muted-foreground/40 text-transparent hover:border-primary/40"
                    )}
                  >
                    <Check className="h-4 w-4" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex-1 max-w-2xl">
          {models.map(
            (model) =>
              model.id === currentModel && (
                <div key={model.id} className="space-y-8">
                  <div>
                    <h2 className="text-2xl font-semibold flex items-center gap-2">
                      <div className={cn("shrink-0", model.color)}>
                        <model.icon className="h-6 w-6" />
                      </div>
                      {model.name}
                    </h2>
                    <p className="mt-2 text-muted-foreground">
                      {model.description}
                    </p>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label className="text-base font-medium">
                          {t(`dashboard.settings.ai.${model.id}.apiKey`)}
                        </Label>
                        <a
                          href={model.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1"
                        >
                          {t("dashboard.settings.ai.getApiKey")}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                      <Input
                        value={getApiKeyValue(model.id)}
                        onChange={(e) => handleApiKeyChange(e, model.id)}
                        type="password"
                        placeholder={t(
                          `dashboard.settings.ai.${model.id}.apiKey`
                        )}
                        className={cn(
                          "h-11",
                          "bg-white dark:bg-gray-900",
                          "border-gray-200 dark:border-gray-800",
                          "focus:ring-2 focus:ring-primary/20"
                        )}
                      />
                    </div>

                    {model.showModelId && (
                      <div className="space-y-4">
                        <Label className="text-base font-medium">
                          {t(`dashboard.settings.ai.${model.id}.modelId`)}
                        </Label>
                        <Input
                          value={getModelIdValue(model.id)}
                          onChange={(e) => handleModelIdChange(e, model.id)}
                          placeholder={
                            AI_MODEL_CONFIGS[model.id].defaultModel ||
                            t(`dashboard.settings.ai.${model.id}.modelId`)
                          }
                          className={cn(
                            "h-11",
                            "bg-white dark:bg-gray-900",
                            "border-gray-200 dark:border-gray-800",
                            "focus:ring-2 focus:ring-primary/20"
                          )}
                        />
                      </div>
                    )}

                    {AI_MODEL_CONFIGS[model.id].allowsCustomEndpoint && (
                      <div className="space-y-4">
                        <Label className="text-base font-medium">
                          {t(`dashboard.settings.ai.${model.id}.apiEndpoint`)}
                        </Label>
                        <Input
                          value={getEndpointValue(model.id)}
                          onChange={(e) => handleApiEndpointChange(e, model.id)}
                          placeholder={
                            AI_MODEL_CONFIGS[model.id].defaultEndpoint ||
                            t(`dashboard.settings.ai.${model.id}.apiEndpoint`)
                          }
                          className={cn(
                            "h-11",
                            "bg-white dark:bg-gray-900",
                            "border-gray-200 dark:border-gray-800",
                            "focus:ring-2 focus:ring-primary/20"
                          )}
                        />
                      </div>
                    )}
                  </div>
                </div>
              )
          )}
        </div>
      </div>
    </div>
  );
};
export const runtime = "edge";

export default AISettingsPage;
