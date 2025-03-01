"use client";
import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { ExternalLink } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import DeepSeekLogo from "@/components/ai/icon/IconDeepseek";
import IconDoubao from "@/components/ai/icon/IconDoubao";
import IconCustom from "@/components/ai/icon/IconCustom";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { useAIConfigStore } from "@/store/useAIConfigStore";
import { cn } from "@/lib/utils";

const AISettingsPage = () => {
  const t = useTranslations();
  const {
    selectedModel,
    doubaoApiKey,
    doubaoModelId,
    deepseekApiKey,
    customApiKey,
    customBaseURL,
    customModelId,
    setSelectedModel,
    setDoubaoApiKey,
    setDoubaoModelId,
    setDeepseekApiKey,
    setCustomApiKey,
    setCustomBaseURL,
    setCustomModelId
  } = useAIConfigStore();

  const [currentModel, setCurrentModel] = useState("");

  useEffect(() => {
    setCurrentModel(selectedModel);
  }, [selectedModel]);

  const handleApiKeyChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: AIModelType
  ) => {
    const value = e.target.value;
    switch (type) {
      case "doubao":
        setDoubaoApiKey(value);
        break;
      case "deepseek":
        setDeepseekApiKey(value);
        break;
      case "custom":
        setCustomApiKey(value);
        break;
    }
  };

  const models = [
    {
      id: "deepseek",
      name: t("dashboard.settings.ai.deepseek.title"),
      description: t("dashboard.settings.ai.deepseek.description"),
      apiKeyDescription: t("dashboard.settings.ai.deepseek.apiKeyDescription"),
      icon: DeepSeekLogo,
      link: "https://platform.deepseek.com",
      color: "text-purple-500",
      bgColor: "bg-purple-50 dark:bg-purple-950/50",
      isConfigured: !!deepseekApiKey
    },
    {
      id: "doubao",
      name: t("dashboard.settings.ai.doubao.title"),
      description: t("dashboard.settings.ai.doubao.description"),
      apiKeyDescription: t("dashboard.settings.ai.doubao.apiKeyDescription"),
      modelIdDescription: t("dashboard.settings.ai.doubao.modelIdDescription"),
      icon: IconDoubao,
      link: "https://console.volcengine.com/ark",
      color: "text-blue-500",
      bgColor: "bg-blue-50 dark:bg-blue-950/50",
      isConfigured: !!(doubaoApiKey && doubaoModelId)
    },
    {
      id: "custom",
      name: t("dashboard.settings.ai.custom.title"),
      description: t("dashboard.settings.ai.custom.description"),
      apiKeyDescription: t("dashboard.settings.ai.custom.apiKeyDescription"),
      baseURLDescription: t("dashboard.settings.ai.custom.baseURLDescription"),
      modelIdDescription: t("dashboard.settings.ai.custom.modelIdDescription"),
      icon: IconCustom,
      link: "#",
      color: "text-gray-500",
      bgColor: "bg-gray-50 dark:bg-gray-950/50",
      isConfigured: !!(customApiKey && customBaseURL && customModelId)
    }
  ];

  return (
    <div className="mx-auto py-4 px-4">
      <div className="flex gap-8">
        {/* 左侧边栏 */}
        <div className="w-64 space-y-6">
          {/* ...原有侧边栏代码保持不变... */}
        </div>

        {/* 右侧配置面板 */}
        <div className="flex-1 max-w-2xl">
          {models.map(
            (model) =>
              model.id === currentModel && (
                <div key={model.id} className="space-y-8">
                  {/* 标题和描述 */}
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

                  {/* 配置表单 */}
                  <div className="space-y-6">
                    {/* API Key 输入 */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-base font-medium">
                          {t(`dashboard.settings.ai.${model.id}.apiKey`)}
                        </Label>
                        {model.id !== "custom" && (
                          <a
                            href={model.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1"
                          >
                            {t("dashboard.settings.ai.getApiKey")}
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {model.apiKeyDescription}
                      </p>
                      <Input
                        value={
                          model.id === "doubao"
                            ? doubaoApiKey
                            : model.id === "deepseek"
                            ? deepseekApiKey
                            : customApiKey
                        }
                        onChange={(e) =>
                          handleApiKeyChange(e, model.id as AIModelType)
                        }
                        type="password"
                        className={cn(
                          "h-11",
                          "bg-white dark:bg-gray-900",
                          "border-gray-200 dark:border-gray-800",
                          "focus:ring-2 focus:ring-primary/20"
                        )}
                      />
                    </div>

                    {/* 豆包模型专属字段 */}
                    {model.id === "doubao" && (
                      <div className="space-y-2">
                        <Label className="text-base font-medium">
                          {t("dashboard.settings.ai.doubao.modelId")}
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          {model.modelIdDescription}
                        </p>
                        <Input
                          value={doubaoModelId}
                          onChange={(e) => setDoubaoModelId(e.target.value)}
                          className={cn(
                            "h-11",
                            "bg-white dark:bg-gray-900",
                            "border-gray-200 dark:border-gray-800",
                            "focus:ring-2 focus:ring-primary/20"
                          )}
                        />
                      </div>
                    )}

                    {/* 自定义服务商专属字段 */}
                    {model.id === "custom" && (
                      <>
                        <div className="space-y-2">
                          <Label className="text-base font-medium">
                            {t("dashboard.settings.ai.custom.baseURL")}
                          </Label>
                          <p className="text-sm text-muted-foreground">
                            {model.baseURLDescription}
                          </p>
                          <Input
                            value={customBaseURL}
                            onChange={(e) => setCustomBaseURL(e.target.value)}
                            className={cn(
                              "h-11",
                              "bg-white dark:bg-gray-900",
                              "border-gray-200 dark:border-gray-800",
                              "focus:ring-2 focus:ring-primary/20"
                            )}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-base font-medium">
                            {t("dashboard.settings.ai.custom.modelId")}
                          </Label>
                          <p className="text-sm text-muted-foreground">
                            {model.modelIdDescription}
                          </p>
                          <Input
                            value={customModelId}
                            onChange={(e) => setCustomModelId(e.target.value)}
                            className={cn(
                              "h-11",
                              "bg-white dark:bg-gray-900",
                              "border-gray-200 dark:border-gray-800",
                              "focus:ring-2 focus:ring-primary/20"
                            )}
                          />
                        </div>
                      </>
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

export default AISettingsPage;

type AIModelType = "doubao" | "deepseek" | "custom";
