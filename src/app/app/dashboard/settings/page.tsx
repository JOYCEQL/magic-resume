"use client";
import { useState, useEffect } from "react";
import { Folder } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import {
  getFileHandle,
  getConfig,
  storeFileHandle,
  storeConfig,
  verifyPermission
} from "@/utils/fileSystem";

const SettingsPage = () => {
  const [directoryHandle, setDirectoryHandle] =
    useState<FileSystemDirectoryHandle | null>(null);
  const [folderPath, setFolderPath] = useState<string>("");
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

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-3xl font-bold tracking-tight">
          {t("dashboard.settings.title")}
        </h2>
      </div>

      <Card className="overflow-hidden border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-md transition-all duration-300">
        <CardHeader className="space-y-4">
          <CardTitle className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950">
              <Folder className="h-6 w-6 text-emerald-500 dark:text-emerald-400" />
            </div>
            <span>{t("dashboard.settings.sync.title")}</span>
          </CardTitle>
          <CardDescription className="text-base">
            {t("dashboard.settings.sync.description")}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6 space-y-4 px-8 pb-8">
          <div className="flex items-center gap-3">
            <div className="flex-1 relative">
              {directoryHandle ? (
                <div className="h-11 px-3 flex items-center gap-2 bg-gray-50 dark:bg-gray-900 border rounded-md">
                  <Folder className="h-4 w-4 text-emerald-500" />
                  <span className="truncate">{folderPath}</span>
                </div>
              ) : (
                <div className="h-11 px-3 flex items-center text-gray-500 bg-gray-50 dark:bg-gray-900 border rounded-md">
                  {t("dashboard.settings.syncDirectory.noFolderConfigured")}
                </div>
              )}
            </div>
            <Button
              onClick={handleSelectDirectory}
              variant="default"
              className="h-11 min-w-[120px]"
            >
              {t("dashboard.settings.sync.select")}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SettingsPage;
