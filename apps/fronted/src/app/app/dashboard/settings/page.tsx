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
import { motion } from "framer-motion";

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
        <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
          {t("dashboard.settings.title")}
        </h2>
      </div>
      <Separator className="my-6" />
      <div className="grid gap-8">
        {/* 同步目录卡片 */}
        <Card className="overflow-hidden border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-md transition-all duration-300">
          <CardHeader className="space-y-4">
            <CardTitle className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950">
                <Folder className="h-6 w-6 text-emerald-500 dark:text-emerald-400" />
              </div>
              <span className="text-gray-900 dark:text-gray-100">
                {t("dashboard.settings.sync.title")}
              </span>
            </CardTitle>
            <CardDescription className="text-base text-gray-600 dark:text-gray-400">
              {t("dashboard.settings.sync.description")}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-4 px-8 pb-8">
            <div className="flex items-center gap-3">
              <div className="flex-1 relative">
                {directoryHandle ? (
                  <div className="h-11 px-3 flex items-center gap-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-md text-emerald-700 dark:text-emerald-300">
                    <Folder className="h-4 w-4 text-emerald-500 dark:text-emerald-400 flex-shrink-0" />
                    <span className="truncate">{folderPath}</span>
                  </div>
                ) : (
                  <div className="h-11 px-3 flex items-center text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-md">
                    {t("dashboard.settings.syncDirectory.noFolderConfigured")}
                  </div>
                )}
              </div>
              <Button
                onClick={handleSelectDirectory}
                variant="default"
                className="h-11 min-w-[120px] bg-gray-900 text-white hover:bg-gray-800 dark:bg-primary dark:text-primary-foreground dark:hover:bg-primary/90"
              >
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{
                    type: "spring",
                    stiffness: 400,
                    damping: 17,
                  }}
                >
                  {t("dashboard.settings.sync.select")}
                </motion.div>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* AI配置卡片 */}
        <Card className="overflow-hidden border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-md transition-all duration-300">
          <CardHeader className="space-y-4">
            <CardTitle className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950">
                <Bot className="h-6 w-6 text-blue-500 dark:text-blue-400" />
              </div>
              <span className="text-gray-900 dark:text-gray-100">
                {t("dashboard.settings.ai.title")}
              </span>
            </CardTitle>
            <CardDescription className="text-base text-gray-600 dark:text-gray-400">
              {t("dashboard.settings.ai.description")}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-8 px-8 pb-8">
            <div className="space-y-3">
              <Label className="text-base text-gray-700 dark:text-gray-300">
                {t("dashboard.settings.ai.selectedModel")}
              </Label>
              <Select
                value={selectedModel}
                onValueChange={(value) =>
                  setSelectedModel(value as "doubao" | "deepseek")
                }
              >
                <SelectTrigger className="h-11 bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800">
                  <SelectValue placeholder="Select a model">
                    {selectedModel && (
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {t(`dashboard.settings.ai.${selectedModel}.title`)}
                        </span>
                      </div>
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="doubao">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {t("dashboard.settings.ai.doubao.title")}
                      </span>
                    </div>
                  </SelectItem>
                  <SelectItem value="deepseek">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {t("dashboard.settings.ai.deepseek.title")}
                      </span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-6">
              <div
                className={cn(
                  "space-y-6 rounded-xl p-6 transition-all duration-300",
                  selectedModel === "doubao"
                    ? "bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm"
                    : "bg-gray-50/50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800/50 opacity-50"
                )}
              >
                <h3 className="text-lg font-semibold flex items-center gap-2 text-gray-800 dark:text-gray-200">
                  <Bot className="h-5 w-5 text-blue-500 dark:text-blue-400" />
                  {t("dashboard.settings.ai.doubao.title")}
                </h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-base flex items-center gap-2 text-gray-700 dark:text-gray-300">
                      <Key className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                      {t("dashboard.settings.ai.doubao.apiKey")}
                      <a
                        href="https://console.volcengine.com/ark"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:underline inline-flex items-center"
                      >
                        <motion.div
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          transition={{
                            type: "spring",
                            stiffness: 400,
                            damping: 17,
                          }}
                        >
                          {t("dashboard.settings.ai.doubao.description")}
                          <ExternalLink className="h-3 w-3 ml-1" />
                        </motion.div>
                      </a>
                    </Label>
                    <Input
                      id="doubaoApiKey"
                      value={doubaoApiKey}
                      onChange={(e) => handleApiKeyChange(e, "doubao")}
                      type="password"
                      className="h-11 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800"
                      placeholder={t("dashboard.settings.ai.doubao.apiKey")}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-base flex items-center gap-2 text-gray-700 dark:text-gray-300">
                      <Hash className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                      {t("dashboard.settings.ai.doubao.modelId")}
                    </Label>
                    <Input
                      id="doubaoModelId"
                      value={doubaoModelId}
                      onChange={(e) => handleModelIdChange(e, "doubao")}
                      className="h-11 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800"
                      placeholder={t("dashboard.settings.ai.doubao.modelId")}
                    />
                  </div>
                </div>
              </div>

              <div
                className={cn(
                  "space-y-6 rounded-xl p-6 transition-all duration-300",
                  selectedModel === "deepseek"
                    ? "bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm"
                    : "bg-gray-50/50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800/50 opacity-50"
                )}
              >
                <h3 className="text-lg font-semibold flex items-center gap-2 text-gray-800 dark:text-gray-200">
                  <Bot className="h-5 w-5 text-blue-500 dark:text-blue-400" />
                  {t("dashboard.settings.ai.deepseek.title")}
                </h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-base flex items-center gap-2 text-gray-700 dark:text-gray-300">
                      <Key className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                      {t("dashboard.settings.ai.deepseek.apiKey")}
                      <a
                        href="https://platform.deepseek.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:underline inline-flex items-center"
                      >
                        <motion.div
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          transition={{
                            type: "spring",
                            stiffness: 400,
                            damping: 17,
                          }}
                        >
                          {t("dashboard.settings.ai.deepseek.description")}
                          <ExternalLink className="h-3 w-3 ml-1" />
                        </motion.div>
                      </a>
                    </Label>
                    <Input
                      id="deepseekApiKey"
                      value={deepseekApiKey}
                      onChange={(e) => handleApiKeyChange(e, "deepseek")}
                      type="password"
                      className="h-11 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800"
                      placeholder={t("dashboard.settings.ai.deepseek.apiKey")}
                    />
                  </div>
                  {/* <div className="space-y-2">
                    <Label className="text-base flex items-center gap-2 text-gray-700 dark:text-gray-300">
                      <Hash className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                      {t("dashboard.settings.ai.deepseek.modelId")}
                    </Label>
                    <Input
                      id="deepseekModelId"
                      value={deepseekModelId}
                      onChange={(e) => handleModelIdChange(e, "deepseek")}
                      className="h-11 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800"
                      placeholder={t("dashboard.settings.ai.deepseek.modelId")}
                    />
                  </div> */}
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
