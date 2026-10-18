import { useState, useEffect } from "react";
import {
  FolderSync,
  FolderOpen,
  FolderCheck,
  Trash2,
} from "lucide-react";
import { useTranslations } from "@/i18n/compat/client";
import { Button } from "@/components/ui/button";
import {
  getFileHandle,
  getConfig,
  storeFileHandle,
  storeConfig,
  verifyPermission,
} from "@/utils/fileSystem";
import { useResumeStore } from "@/store/useResumeStore";
import { syncResumesFromDirectory } from "@/utils/resumeFileSync";
import { cn } from "@/lib/utils";
import ThemeSettings from "./ThemeSettings";
import LanguageSettings from "./LanguageSettings";

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
      await storeFileHandle("syncDirectory", null as any);
      await storeConfig("syncDirectoryPath", "");
    } catch (error) {
      console.error("Error removing directory:", error);
    }
  };

  return (
    <div className="mx-auto w-full max-w-[1600px] px-4 py-8 sm:px-6">
      <header className="mb-8">
        <div className="flex min-h-[50px] flex-wrap items-center justify-between gap-3">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            {t("dashboard.settings.title")}
          </h1>
        </div>
      </header>

      <div className="space-y-5">
        <div className="grid gap-5 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <ThemeSettings />
          </div>
          <div className="lg:col-span-5">
            <LanguageSettings />
          </div>
        </div>

        <section className="rounded-2xl border border-border/80 bg-white/90 p-6 shadow-[0_1px_2px_rgba(28,28,24,0.03),0_6px_20px_rgba(28,28,24,0.02)] dark:bg-card">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-3.5">
              <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary/70 text-foreground">
                <FolderSync className="h-4 w-4" />
                {directoryHandle && (
                  <span className="absolute -right-0.5 -top-0.5 size-2 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-card" />
                )}
              </div>
              <div className="min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-sans text-base font-semibold tracking-tight text-foreground">
                    {t("dashboard.settings.sync.title")}
                  </h2>
                  <span
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium",
                      directoryHandle
                        ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                        : "border-border/70 bg-secondary/60 text-muted-foreground"
                    )}
                  >
                    <span
                      className={cn(
                        "size-1.5 rounded-full",
                        directoryHandle
                          ? "bg-emerald-500"
                          : "bg-muted-foreground/45"
                      )}
                    />
                    {directoryHandle
                      ? t("dashboard.settings.syncDirectory.statusConfigured")
                      : t("dashboard.settings.syncDirectory.statusNotConfigured")}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  {t("dashboard.settings.sync.description")}
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 lg:min-w-[420px] xl:min-w-[480px]">
              <div className="min-w-0 flex-1">
                {directoryHandle ? (
                  <div className="flex h-10 items-center gap-2.5 rounded-xl border border-border/80 bg-background/80 px-3.5 shadow-[inset_0_1px_2px_rgba(28,28,24,0.02)] dark:bg-secondary/40">
                    <FolderCheck className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                    <span className="truncate font-mono text-xs sm:text-sm font-medium text-foreground">
                      {folderPath}
                    </span>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleSelectDirectory}
                    className="flex h-10 w-full cursor-pointer items-center gap-2.5 rounded-xl border border-dashed border-border/90 bg-background/50 px-3.5 text-left text-xs sm:text-sm text-muted-foreground transition-colors hover:border-foreground/30 hover:bg-background/90 hover:text-foreground dark:bg-background/25 dark:hover:bg-secondary/30"
                  >
                    <FolderOpen className="size-4 shrink-0 text-muted-foreground/70" />
                    <span className="truncate">
                      {t("dashboard.settings.syncDirectory.noFolderConfigured")}
                    </span>
                  </button>
                )}
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <Button
                  type="button"
                  onClick={handleSelectDirectory}
                  variant={directoryHandle ? "outline" : "default"}
                  className={cn(
                    "h-10 flex-1 sm:flex-none rounded-xl px-4 text-xs sm:text-sm font-medium cursor-pointer transition-all",
                    directoryHandle
                      ? "border-border/80 bg-background/70 hover:bg-accent/60"
                      : "bg-primary text-primary-foreground shadow-xs hover:opacity-90"
                  )}
                >
                  <FolderOpen className="mr-2 size-3.5" />
                  {directoryHandle
                    ? t("dashboard.settings.syncDirectory.changeFolder")
                    : t("dashboard.settings.sync.select")}
                </Button>
                {directoryHandle && (
                  <Button
                    type="button"
                    onClick={handleRemoveDirectory}
                    variant="outline"
                    size="icon"
                    className="size-10 shrink-0 rounded-xl border-border/80 bg-background/70 text-muted-foreground hover:border-destructive/30 hover:bg-destructive/10 hover:text-destructive transition-colors cursor-pointer"
                    title={t("dashboard.settings.syncDirectory.removeFolder")}
                    aria-label={t("dashboard.settings.syncDirectory.removeFolder")}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
export const runtime = "edge";

export default SettingsPage;
