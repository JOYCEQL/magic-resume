import { useState, useEffect } from "react";
import { FolderSync, FolderOpen, FolderCheck, FolderPlus, Trash2 } from "lucide-react";
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
import { useResumeStore } from "@/store/useResumeStore";
import { syncResumesFromDirectory } from "@/utils/resumeFileSync";
import ThemeSettings from "./ThemeSettings";

const SettingsPage = () => {
  const [directoryHandle, setDirectoryHandle] =
    useState<FileSystemDirectoryHandle | null>(null);
  const [folderPath, setFolderPath] = useState<string>("");
  const t = useTranslations();
  const updateResumeFromFile = useResumeStore(
    (state) => state.updateResumeFromFile
  );

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
        await syncResumesFromDirectory(updateResumeFromFile);
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
    <div className="w-full max-w-5xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col space-y-8">
        <header className="border-b border-border/40 pb-6">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            {t("dashboard.settings.title")}
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
            {t("dashboard.settings.description")}
          </p>
        </header>

        <div className="space-y-6">
          <ThemeSettings />

          <Card className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-xs transition-shadow hover:shadow-sm">
            <CardHeader className="border-b border-border/40 p-6 pb-5">
              <div className="flex items-start gap-4">
                <div className="relative flex size-10 shrink-0 items-center justify-center rounded-xl bg-zinc-900 text-white shadow-xs dark:bg-zinc-800 dark:text-zinc-100 dark:border dark:border-zinc-700">
                  <FolderSync className="size-5" />
                  {directoryHandle && (
                    <span className="absolute -top-0.5 -right-0.5 size-2 rounded-full bg-emerald-500 ring-2 ring-card" />
                  )}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <CardTitle className="text-base sm:text-lg font-semibold tracking-tight text-foreground">
                      {t("dashboard.settings.sync.title")}
                    </CardTitle>
                    {directoryHandle ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        <span className="size-1.5 rounded-full bg-emerald-500" />
                        {t("dashboard.settings.syncDirectory.statusConfigured")}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-medium text-amber-600 dark:text-amber-400 border border-amber-500/20">
                        <span className="size-1.5 rounded-full bg-amber-500" />
                        {t("dashboard.settings.syncDirectory.statusNotConfigured")}
                      </span>
                    )}
                  </div>
                  <CardDescription className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    {t("dashboard.settings.sync.description")}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <div className="flex-1 min-w-0">
                  {directoryHandle ? (
                    <div className="flex h-11 items-center gap-3 rounded-xl border border-border/80 bg-muted/30 px-3.5 transition-colors">
                      <FolderCheck className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                      <span className="truncate font-mono text-xs sm:text-sm font-medium text-foreground">
                        {folderPath}
                      </span>
                    </div>
                  ) : (
                    <div className="flex h-11 items-center justify-center sm:justify-start gap-2 rounded-xl border border-dashed border-border/80 bg-muted/20 px-3.5 text-xs sm:text-sm text-muted-foreground">
                      <FolderPlus className="size-4 shrink-0 text-muted-foreground/60" />
                      <span>{t("dashboard.settings.syncDirectory.noFolderConfigured")}</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2.5 w-full sm:w-auto shrink-0">
                  <Button
                    onClick={handleSelectDirectory}
                    variant="default"
                    className="flex-1 sm:flex-none h-11 px-5 rounded-xl font-medium shadow-xs hover:shadow transition-all cursor-pointer bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
                  >
                    <FolderOpen className="mr-2 size-4" />
                    {directoryHandle
                      ? t("dashboard.settings.syncDirectory.changeFolder")
                      : t("dashboard.settings.sync.select")}
                  </Button>
                  {directoryHandle && (
                    <Button
                      onClick={handleRemoveDirectory}
                      variant="outline"
                      size="icon"
                      className="size-11 shrink-0 rounded-xl border-border/80 text-muted-foreground hover:bg-red-500/10 hover:text-red-600 hover:border-red-500/30 dark:hover:bg-red-500/15 dark:hover:text-red-400 transition-colors cursor-pointer"
                      title={t("dashboard.settings.syncDirectory.removeFolder")}
                    >
                      <Trash2 className="size-4" />
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
