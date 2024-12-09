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
        // 获取文件夹路径
        const path = handle.name;
        setFolderPath(path);
        // 存储文件句柄和路径
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
      </div>
    </div>
  );
};

export default SettingsPage;
