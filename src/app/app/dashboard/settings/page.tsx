"use client";
import { useState, useEffect } from "react";
import { Folder, Trash2 } from "lucide-react";
import { useTranslations } from "@/i18n/compat/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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

  const handleRemoveDirectory = async () => {
    try {
      setDirectoryHandle(null);
      setFolderPath("");
      // Clear from IndexedDB
      await storeFileHandle("syncDirectory", null as any);
      await storeConfig("syncDirectoryPath", "");
    } catch (error) {
      console.error("Error removing directory:", error);
    }
  };

  return (
    <div className="w-full max-w-[1600px] mx-auto py-8 px-6 lg:px-8">
      <div className="flex flex-col space-y-8">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            {t("dashboard.settings.title")}
          </h2>
        </div>

        <div className="space-y-6">
          <Card className="overflow-hidden border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-md transition-all duration-300 bg-white dark:bg-gray-900/50">
            <CardHeader className="border-b border-gray-100 dark:border-gray-800/50 pb-6">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-orange-50 dark:bg-orange-900/20 shrink-0">
                  <Folder className="h-6 w-6 text-[#D97757] dark:text-[#D97757]/90" />
                </div>
                <div className="space-y-1">
                  <CardTitle className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                    {t("dashboard.settings.sync.title")}
                  </CardTitle>
                  <CardDescription className="text-base text-gray-500 dark:text-gray-400 leading-relaxed">
                    {t("dashboard.settings.sync.description")}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-8 px-6 pb-8 md:px-8">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                <div className="flex-1 relative group">
                  {directoryHandle ? (
                    <div className="h-12 px-4 flex items-center gap-3 bg-gray-50/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl transition-colors group-hover:border-[#D97757]/30 group-hover:bg-orange-50/30 dark:group-hover:bg-orange-900/10">
                      <Folder className="h-5 w-5 text-[#D97757]" />
                      <span className="truncate font-medium text-gray-700 dark:text-gray-300 font-mono text-sm">
                        {folderPath}
                      </span>
                    </div>
                  ) : (
                    <div className="h-12 px-4 flex items-center justify-center sm:justify-start text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-900 border border-dashed border-gray-300 dark:border-gray-700 rounded-xl">
                      {t("dashboard.settings.syncDirectory.noFolderConfigured")}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <Button
                    onClick={handleSelectDirectory}
                    variant="default"
                    className="flex-1 sm:flex-none h-12 px-6  text-white shadow-sm hover:shadow transition-all duration-200 rounded-xl font-medium cursor-pointer"
                  >
                    {t("dashboard.settings.sync.select")}
                  </Button>
                  {directoryHandle && (
                    <Button
                      onClick={handleRemoveDirectory}
                      variant="outline"
                      size="icon"
                      className="h-12 w-12 rounded-xl border-gray-200 dark:border-gray-800 hover:bg-red-50 hover:text-red-500 hover:border-red-200 dark:hover:bg-red-950/30 dark:hover:text-red-400 dark:hover:border-red-900/50 transition-colors"
                      title="Remove synced directory"
                    >
                      <Trash2 className="h-5 w-5" />
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
export const runtime = "edge";

export default SettingsPage;
