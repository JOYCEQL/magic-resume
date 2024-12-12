"use client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Folder } from "lucide-react";
import { useState, useEffect } from "react";
import { useConfigStore } from "@/store/useConfigStore";
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

  return (
    <div className="flex-1 overflow-auto">
      <div className="h-[60px] border-b px-6 flex items-center">
        <h1 className="text-xl font-semibold">系统设置</h1>
      </div>
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Folder className="h-5 w-5" />
              文件同步配置
            </CardTitle>
            <CardDescription>
              请选择一个文件夹用于存储简历数据。所有的简历将会以 JSON
              格式保存在这个文件夹中。
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">
                    {folderPath
                      ? `当前同步文件夹: ${folderPath}`
                      : "未配置同步文件夹"}
                  </p>
                </div>
                <Button
                  variant={folderPath ? "outline" : "default"}
                  onClick={handleSelectDirectory}
                >
                  {folderPath ? "更改文件夹" : "选择文件夹"}
                </Button>
              </div>
              {!folderPath && (
                <p className="text-sm text-yellow-500">
                  请先选择一个文件夹用于同步简历数据
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm mt-8">
          <h2 className="text-xl font-semibold mb-4">OpenAI API Key</h2>
          <div className="space-y-4">
            <div>
              <label
                htmlFor="apiKey"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                API Key
              </label>
              <div className="relative">
                <input
                  type="textarea"
                  id="apiKey"
                  className="w-full h-[60px] px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 
                    focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
                  placeholder="sk-xxxxxxxxxxxxxxxxxxxxxxxx"
                />
              </div>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                您的API Key将被安全加密存储。获取API Key请访问：
                <a
                  href="https://platform.openai.com/api-keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                  OpenAI API Keys
                </a>
              </p>
            </div>

            <div className="flex items-center space-x-4">
              <button
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 
                  transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                保存
              </button>
              <button
                className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 
                  dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 
                  transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              >
                验证
              </button>
            </div>
          </div>
        </div> */}
      </div>
    </div>
  );
};

export default SettingsPage;
