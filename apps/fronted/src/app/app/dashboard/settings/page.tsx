"use client";
import { useState, useEffect } from "react";
import { Folder, Bot, Key, Hash, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAIConfigStore } from "@/store/useAIConfigStore";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  getFileHandle,
  getConfig,
  storeFileHandle,
  storeConfig,
  verifyPermission,
} from "@/utils/fileSystem";
import { useTranslations } from "next-intl";

const SettingsPage = () => {
  const [directoryHandle, setDirectoryHandle] =
    useState<FileSystemDirectoryHandle | null>(null);
  const [folderPath, setFolderPath] = useState<string>("");

  const {
    selectedModel,
    doubaoApiKey,
    doubaoModelId,
    deepseekApiKey,
    deepseekModelId,
    setSelectedModel,
    setDoubaoApiKey,
    setDoubaoModelId,
    setDeepseekApiKey,
    setDeepseekModelId,
  } = useAIConfigStore();

  const t = useTranslations();

  useEffect(() => {
    const loadSavedConfig = async () => {
      try {
        const handle = await getFileHandle("syncDirectory");
        const path = await getConfig("syncDirectoryPath");

        if (handle && path) {
          const hasPermission = await verifyPermission(handle);
          if (hasPermission) {
            setDirectoryHandle(handle as FileSystemDirectoryHandle);
            setFolderPath(path);
          }
        }
      } catch (error) {
        console.error("Error loading saved config:", error);
      }
    };

    loadSavedConfig();
  }, []);

  const handleSelectDirectory = async () => {
    try {
      if (!("showDirectoryPicker" in window)) {
        alert(
          "Your browser does not support directory selection. Please use a modern browser."
        );
        return;
      }

      const handle = await window.showDirectoryPicker({ mode: "readwrite" });
      const hasPermission = await verifyPermission(handle);
      if (hasPermission) {
        setDirectoryHandle(handle);
        const path = handle.name;
        setFolderPath(path);
        await storeFileHandle("syncDirectory", handle);
        await storeConfig("syncDirectoryPath", path);
      }
    } catch (error) {
      console.error("Error selecting directory:", error);
    }
  };

  const handleApiKeyChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "doubao" | "deepseek"
  ) => {
    const newApiKey = e.target.value;
    if (type === "doubao") {
      setDoubaoApiKey(newApiKey);
    } else {
      setDeepseekApiKey(newApiKey);
    }
  };

  const handleModelIdChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "doubao" | "deepseek"
  ) => {
    const newModelId = e.target.value;
    if (type === "doubao") {
      setDoubaoModelId(newModelId);
    } else {
      setDeepseekModelId(newModelId);
    }
  };

  return (
    <div className="flex-1 space-y-8 px-4 pt-6 mx-auto max-w-4xl">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-transparent bg-clip-text">
          {t("dashboard.settings.title")}
        </h2>
      </div>
      <Separator className="my-6" />
      <div className="grid gap-8">
        {/* 同步目录卡片 */}
        <Card className="overflow-hidden border-0 shadow-lg shadow-indigo-500/5 hover:shadow-indigo-500/10 transition-all duration-300">
          <CardHeader className="space-y-4 bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
            <CardTitle className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 dark:from-indigo-500/20 dark:to-purple-500/20">
                <Folder className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <span className="bg-gradient-to-br from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 text-transparent bg-clip-text">
                {t("dashboard.settings.sync.title")}
              </span>
            </CardTitle>
            <CardDescription className="text-base text-slate-600 dark:text-slate-400">
              {t("dashboard.settings.sync.description")}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-4 px-8 pb-8">
            <div className="flex items-center gap-3">
              <Input
                value={folderPath}
                readOnly
                className="h-11 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 focus-visible:ring-indigo-500"
                placeholder={t(
                  "dashboard.settings.syncDirectory.noFolderConfigured"
                )}
              />
              <Button
                onClick={handleSelectDirectory}
                className="h-11 min-w-[120px] bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white shadow-md shadow-indigo-500/20 hover:shadow-indigo-500/30 transition-all duration-300"
              >
                {t("dashboard.settings.sync.select")}
              </Button>
            </div>
            {directoryHandle && (
              <Badge
                variant="outline"
                className="gap-2 py-1.5 text-sm border-slate-200 dark:border-slate-800"
              >
                <Folder className="h-4 w-4" />
                {folderPath}
              </Badge>
            )}
          </CardContent>
        </Card>

        {/* AI配置卡片 */}
        <Card className="overflow-hidden border-0 shadow-lg shadow-indigo-500/5 hover:shadow-indigo-500/10 transition-all duration-300">
          <CardHeader className="space-y-4 bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
            <CardTitle className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 dark:from-indigo-500/20 dark:to-purple-500/20">
                <Bot className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <span className="bg-gradient-to-br from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 text-transparent bg-clip-text">
                {t("dashboard.settings.ai.title")}
              </span>
            </CardTitle>
            <CardDescription className="text-base text-slate-600 dark:text-slate-400">
              {t("dashboard.settings.ai.description")}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-8 px-8 pb-8">
            <div className="space-y-3">
              <Label className="text-base text-slate-700 dark:text-slate-300">
                {t("dashboard.settings.ai.selectedModel")}
              </Label>
              <Select
                value={selectedModel}
                onValueChange={(value) =>
                  setSelectedModel(value as "doubao" | "deepseek")
                }
              >
                <SelectTrigger className="h-11 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                  <SelectValue placeholder="Select a model" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="doubao">
                    <span className="font-medium">
                      {t("dashboard.settings.ai.doubao.title")}
                    </span>
                  </SelectItem>
                  <SelectItem value="deepseek">
                    <span className="font-medium">
                      {t("dashboard.settings.ai.deepseek.title")}
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-6">
              <div
                className={cn(
                  "space-y-6 rounded-xl p-6 transition-all duration-300",
                  selectedModel === "doubao"
                    ? "bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-900/50 border border-indigo-100 dark:border-indigo-500/20 shadow-lg shadow-indigo-500/5"
                    : "bg-slate-50/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800/50 opacity-50"
                )}
              >
                <h3 className="text-lg font-semibold flex items-center gap-2 text-slate-800 dark:text-slate-200">
                  <Bot className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                  {t("dashboard.settings.ai.doubao.title")}
                </h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-base flex items-center gap-2 text-slate-700 dark:text-slate-300">
                      <Key className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                      {t("dashboard.settings.ai.doubao.apiKey")}
                      <a
                        href="https://www.doubao.com/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 hover:underline inline-flex items-center"
                      >
                        {t("dashboard.settings.aiConfig.apiKey.description")}
                        <ExternalLink className="h-3 w-3 ml-1" />
                      </a>
                    </Label>
                    <Input
                      id="doubaoApiKey"
                      value={doubaoApiKey}
                      onChange={(e) => handleApiKeyChange(e, "doubao")}
                      type="password"
                      className="h-11 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 focus-visible:ring-indigo-500"
                      placeholder={t(
                        "dashboard.settings.aiConfig.apiKey.placeholder"
                      )}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-base flex items-center gap-2 text-slate-700 dark:text-slate-300">
                      <Hash className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                      {t("dashboard.settings.ai.doubao.modelId")}
                    </Label>
                    <Input
                      id="doubaoModelId"
                      value={doubaoModelId}
                      onChange={(e) => handleModelIdChange(e, "doubao")}
                      className="h-11 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 focus-visible:ring-indigo-500"
                      placeholder={t(
                        "dashboard.settings.aiConfig.modelId.placeholder"
                      )}
                    />
                  </div>
                </div>
              </div>

              <div
                className={cn(
                  "space-y-6 rounded-xl p-6 transition-all duration-300",
                  selectedModel === "deepseek"
                    ? "bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-900/50 border border-indigo-100 dark:border-indigo-500/20 shadow-lg shadow-indigo-500/5"
                    : "bg-slate-50/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800/50 opacity-50"
                )}
              >
                <h3 className="text-lg font-semibold flex items-center gap-2 text-slate-800 dark:text-slate-200">
                  <Bot className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                  {t("dashboard.settings.ai.deepseek.title")}
                </h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-base flex items-center gap-2 text-slate-700 dark:text-slate-300">
                      <Key className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                      {t("dashboard.settings.ai.deepseek.apiKey")}
                      <a
                        href="https://platform.deepseek.com/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 hover:underline inline-flex items-center"
                      >
                        {t("dashboard.settings.aiConfig.apiKey.description")}
                        <ExternalLink className="h-3 w-3 ml-1" />
                      </a>
                    </Label>
                    <Input
                      id="deepseekApiKey"
                      value={deepseekApiKey}
                      onChange={(e) => handleApiKeyChange(e, "deepseek")}
                      type="password"
                      className="h-11 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 focus-visible:ring-indigo-500"
                      placeholder={t(
                        "dashboard.settings.aiConfig.apiKey.placeholder"
                      )}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-base flex items-center gap-2 text-slate-700 dark:text-slate-300">
                      <Hash className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                      {t("dashboard.settings.ai.deepseek.modelId")}
                    </Label>
                    <Input
                      id="deepseekModelId"
                      value={deepseekModelId}
                      onChange={(e) => handleModelIdChange(e, "deepseek")}
                      className="h-11 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 focus-visible:ring-indigo-500"
                      placeholder={t(
                        "dashboard.settings.aiConfig.modelId.placeholder"
                      )}
                    />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SettingsPage;
