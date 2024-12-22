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
  getFileHandle,
  getConfig,
  storeFileHandle,
  storeConfig,
  verifyPermission,
} from "@/utils/fileSystem";

const SettingsPage = () => {
  const [directoryHandle, setDirectoryHandle] =
    useState<FileSystemDirectoryHandle | null>(null);
  const [folderPath, setFolderPath] = useState<string>("");

  const { doubaoApiKey, doubaoModelId, setDoubaoApiKey, setDoubaoModelId } =
    useAIConfigStore();

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

  const handleApiKeyChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const newApiKey = e.target.value;
    setDoubaoApiKey(newApiKey);
  };

  const handleModelIdChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const newModelId = e.target.value;
    setDoubaoModelId(newModelId);
  };

  return (
    <div className="flex-1 space-y-6 px-4 pt-6 mx-auto">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-indigo-500 to-purple-500 text-transparent bg-clip-text">
          系统设置
        </h2>
      </div>
      <Separator className="my-6" />
      <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
        <Card
          className={cn(
            "col-span-1 border-2 transition-all duration-200",
            "hover:border-indigo-500/20 hover:shadow-lg"
          )}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950">
                <Folder className="h-5 w-5 text-indigo-500" />
              </div>
              文件同步配置
            </CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              选择一个文件夹存储你的简历数据，所有简历将以 JSON
              格式保存，确保数据安全。
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  {folderPath ? (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">
                        当前同步文件夹
                      </Label>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="secondary"
                          className="text-xs py-2 px-3"
                        >
                          <Folder className="h-3 w-3 mr-1" />
                          {folderPath}
                        </Badge>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-6 bg-muted/30 rounded-lg">
                      <p className="text-sm text-muted-foreground">
                        还没有配置同步文件夹哦～
                      </p>
                    </div>
                  )}
                </div>
                <Button
                  variant={folderPath ? "outline" : "default"}
                  onClick={handleSelectDirectory}
                  className={cn(
                    "shrink-0",
                    !folderPath &&
                      "bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:from-indigo-600 hover:to-purple-600"
                  )}
                >
                  {folderPath ? "更改文件夹" : "选择文件夹"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card
          className={cn(
            "col-span-1 border-2 transition-all duration-200",
            "hover:border-purple-500/20 hover:shadow-lg"
          )}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-950">
                <Bot className="h-5 w-5 text-purple-500" />
              </div>
              AI 模型配置
            </CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              配置豆包大模型，让 AI 助手为你的简历提供智能优化和建议。
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="space-y-5">
                <div className="space-y-3">
                  <Label className="flex items-center gap-2 text-sm font-medium">
                    <div className="p-1.5 rounded-md bg-purple-50 dark:bg-purple-950">
                      <Key className="h-4 w-4 text-purple-500" />
                    </div>
                    豆包 API 密钥
                  </Label>
                  <Input
                    id="doubaoApiKey"
                    type="password"
                    value={doubaoApiKey}
                    onChange={handleApiKeyChange}
                    placeholder="请输入豆包 API 密钥"
                    className="font-mono bg-muted/30"
                  />
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <span>在豆包开放平台获取 API 密钥</span>
                    <ExternalLink className="h-3 w-3" />
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="flex items-center gap-2 text-sm font-medium">
                    <div className="p-1.5 rounded-md bg-purple-50 dark:bg-purple-950">
                      <Hash className="h-4 w-4 text-purple-500" />
                    </div>
                    豆包模型 ID
                  </Label>
                  <Input
                    id="doubaoModelId"
                    type="text"
                    value={doubaoModelId}
                    onChange={handleModelIdChange}
                    placeholder="请输入豆包模型 ID"
                    className="font-mono bg-muted/30"
                  />
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <span>在豆包开放平台获取模型 ID</span>
                    <ExternalLink className="h-3 w-3" />
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
