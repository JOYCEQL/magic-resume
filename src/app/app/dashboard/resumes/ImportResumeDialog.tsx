import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "@/i18n/compat/client";
import {
  Braces,
  Check,
  ChevronRight,
  FileScan,
  FileText,
  Loader2,
  Settings2,
} from "lucide-react";
import { ProviderMark } from "@/app/app/dashboard/ai/ProviderMark";
import type { AIProvider } from "@/config/ai-models";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ImportResumeDialogProps {
  modelLabel: string;
  markdownModelLabel: string;
  pdfProvider?: AIProvider;
  markdownProvider?: AIProvider;
  onMarkdown: () => void;
  onConfigure: () => void;
  open: boolean;
  isImporting: boolean;
  onOpenChange: (open: boolean) => void;
  jsonFileInputRef: React.RefObject<HTMLInputElement>;
  pdfFileInputRef: React.RefObject<HTMLInputElement>;
  onJsonFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onPdfFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

function ModelMeta({
  label,
  provider,
}: {
  label: string;
  provider?: AIProvider;
}) {
  return (
    <span
      className={cn(
        "inline-flex max-w-[210px] shrink-0 items-center gap-1.5 text-xs",
        provider
          ? "text-foreground/75"
          : "font-medium text-red-600 dark:text-red-400"
      )}
    >
      {provider ? (
        <ProviderMark
          provider={provider}
          size="xs"
          className="h-3.5 w-3.5 border-0 bg-transparent shadow-none dark:bg-transparent"
        />
      ) : (
        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-red-500 dark:bg-red-400" />
      )}
      <span className="truncate">{label}</span>
    </span>
  );
}

export const ImportResumeDialog = ({
  modelLabel,
  markdownModelLabel,
  pdfProvider,
  markdownProvider,
  onMarkdown,
  onConfigure,
  open,
  isImporting,
  onOpenChange,
  jsonFileInputRef,
  pdfFileInputRef,
  onJsonFileChange,
  onPdfFileChange,
}: ImportResumeDialogProps) => {
  const t = useTranslations();
  const [nudgeKey, setNudgeKey] = useState(0);
  const [isNudging, setIsNudging] = useState(false);

  const configuredCount =
    Number(Boolean(markdownProvider)) + Number(Boolean(pdfProvider));

  useEffect(() => {
    if (!open) {
      setNudgeKey(0);
      setIsNudging(false);
    }
  }, [open]);

  useEffect(() => {
    if (nudgeKey === 0) return;
    setIsNudging(true);
    const timer = window.setTimeout(() => {
      setIsNudging(false);
    }, 950);
    return () => window.clearTimeout(timer);
  }, [nudgeKey]);

  const triggerConfigureNudge = () => {
    setNudgeKey((prev) => prev + 1);
  };

  return (
    <>
      <input
        ref={jsonFileInputRef}
        type="file"
        accept=".json,application/json"
        className="hidden"
        onChange={onJsonFileChange}
      />
      <input
        ref={pdfFileInputRef}
        type="file"
        accept=".pdf,application/pdf"
        className="hidden"
        onChange={onPdfFileChange}
      />

      <Dialog
        open={open}
        onOpenChange={(nextOpen) => {
          if (isImporting) return;
          onOpenChange(nextOpen);
        }}
      >
        <DialogContent className="max-h-[90dvh] gap-0 overflow-hidden border border-border/80 bg-background p-6 shadow-[0_24px_64px_-16px_rgba(28,28,24,0.14)] dark:border-border/70 dark:shadow-[0_24px_64px_-16px_rgba(0,0,0,0.65)] sm:max-w-[480px] sm:rounded-2xl">
          <DialogHeader className="space-y-1.5 text-left">
            <DialogTitle className="text-lg font-semibold tracking-tight text-foreground">
              {t("dashboard.resumes.importDialog.title")}
            </DialogTitle>
            <DialogDescription className="text-[13px] leading-relaxed text-muted-foreground">
              {t("dashboard.resumes.importDialog.description")}
            </DialogDescription>
          </DialogHeader>

          <div className="mt-5 space-y-3.5">
            {/* Part 1: Direct Import (No Model Needed) */}
            <button
              type="button"
              disabled={isImporting}
              onClick={() => jsonFileInputRef.current?.click()}
              className={cn(
                "group flex w-full items-center gap-3.5 rounded-xl border border-border/80 bg-white px-4 py-3.5 text-left transition-colors dark:border-border/70 dark:bg-card",
                "hover:border-foreground/20 hover:bg-secondary/20 dark:hover:bg-secondary/35",
                "disabled:cursor-not-allowed disabled:opacity-60"
              )}
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary/70 text-foreground/80 dark:bg-secondary">
                <Braces className="h-4 w-4" />
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground">
                  {t("dashboard.resumes.importDialog.jsonTitle")}
                </p>
                <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                  {t("dashboard.resumes.importDialog.jsonDescription")}
                </p>
              </div>

              <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/45 transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-foreground/75" />
            </button>

            {/* Part 2: AI-Powered Imports (Requires Model Configuration) */}
            <div className="rounded-xl border border-border/80 bg-white dark:border-border/70 dark:bg-card">
              <div className="flex items-center justify-between gap-2 rounded-t-xl border-b border-border/60 bg-secondary/35 px-4 py-2 dark:border-border/60 dark:bg-secondary/25">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-medium text-muted-foreground">
                    {t("dashboard.resumes.importDialog.aiSectionTitle")}
                  </span>
                  {configuredCount === 2 ? (
                    <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600 dark:bg-emerald-400/20 dark:text-emerald-400">
                      <Check className="h-2.5 w-2.5 stroke-[2.75]" />
                    </span>
                  ) : (
                    <span className="rounded-md bg-secondary/90 px-1.5 py-0.5 font-mono text-[10px] font-medium leading-none text-muted-foreground tabular-nums dark:bg-secondary">
                      {configuredCount}/2
                    </span>
                  )}
                </div>

                <motion.button
                  key={nudgeKey}
                  type="button"
                  onClick={onConfigure}
                  disabled={isImporting}
                  animate={
                    nudgeKey > 0
                      ? { scale: [1, 1.06, 0.98, 1.03, 1] }
                      : undefined
                  }
                  transition={{ duration: 0.45, ease: "easeOut" }}
                  className={cn(
                    "relative inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium transition-colors disabled:opacity-50",
                    isNudging
                      ? "bg-foreground text-background shadow-xs"
                      : "text-foreground/85 hover:bg-secondary/80 hover:text-foreground dark:hover:bg-secondary"
                  )}
                >
                  <AnimatePresence>
                    {nudgeKey > 0 && (
                      <>
                        <motion.span
                          key={`wave-1-${nudgeKey}`}
                          aria-hidden="true"
                          initial={{ scale: 0.95, opacity: 0.65 }}
                          animate={{ scale: 1.55, opacity: 0 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.7, ease: "easeOut" }}
                          className="pointer-events-none absolute inset-0 rounded-md border-2 border-foreground/60 dark:border-foreground/70"
                        />
                        <motion.span
                          key={`wave-2-${nudgeKey}`}
                          aria-hidden="true"
                          initial={{ scale: 0.95, opacity: 0.5 }}
                          animate={{ scale: 1.85, opacity: 0 }}
                          exit={{ opacity: 0 }}
                          transition={{
                            duration: 0.85,
                            delay: 0.14,
                            ease: "easeOut",
                          }}
                          className="pointer-events-none absolute inset-0 rounded-md border border-foreground/45 dark:border-foreground/55"
                        />
                      </>
                    )}
                  </AnimatePresence>

                  <Settings2
                    className={cn(
                      "h-3 w-3 transition-colors",
                      isNudging ? "text-background" : "text-muted-foreground"
                    )}
                  />
                  <span>{t("dashboard.resumes.importDialog.configure")}</span>
                </motion.button>
              </div>

              <div className="divide-y divide-border/60 dark:divide-border/60">
                {/* Markdown Import */}
                <button
                  type="button"
                  disabled={isImporting}
                  aria-disabled={isImporting || !markdownProvider}
                  onClick={() => {
                    if (!markdownProvider) {
                      triggerConfigureNudge();
                      return;
                    }
                    onMarkdown();
                  }}
                  className={cn(
                    "group flex w-full items-center gap-3.5 px-4 py-3 text-left transition-colors",
                    markdownProvider
                      ? "hover:bg-secondary/20 dark:hover:bg-secondary/35"
                      : "cursor-not-allowed",
                    "disabled:cursor-not-allowed"
                  )}
                >
                  <div
                    className={cn(
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary/70 text-foreground/80 transition-opacity dark:bg-secondary",
                      !markdownProvider && "opacity-45"
                    )}
                  >
                    <FileText className="h-4 w-4" />
                  </div>

                  <div className="flex min-w-0 flex-1 items-center justify-between gap-2">
                    <p
                      className={cn(
                        "text-sm font-medium text-foreground transition-opacity",
                        !markdownProvider && "opacity-50"
                      )}
                    >
                      {t("dashboard.resumes.importDialog.markdownTitle")}
                    </p>
                    <ModelMeta
                      provider={markdownProvider}
                      label={markdownModelLabel}
                    />
                  </div>

                  <ChevronRight
                    className={cn(
                      "h-4 w-4 shrink-0 text-muted-foreground/45 transition-all duration-150",
                      markdownProvider
                        ? "group-hover:translate-x-0.5 group-hover:text-foreground/75"
                        : "opacity-35"
                    )}
                  />
                </button>

                {/* PDF Import */}
                <button
                  type="button"
                  disabled={isImporting}
                  aria-disabled={isImporting || !pdfProvider}
                  onClick={() => {
                    if (!pdfProvider) {
                      triggerConfigureNudge();
                      return;
                    }
                    pdfFileInputRef.current?.click();
                  }}
                  className={cn(
                    "group flex w-full items-center gap-3.5 px-4 py-3 text-left transition-colors",
                    pdfProvider
                      ? "hover:bg-secondary/20 dark:hover:bg-secondary/35"
                      : "cursor-not-allowed",
                    "disabled:cursor-not-allowed"
                  )}
                >
                  <div
                    className={cn(
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary/70 text-foreground/80 transition-opacity dark:bg-secondary",
                      !pdfProvider && "opacity-45"
                    )}
                  >
                    <FileScan className="h-4 w-4" />
                  </div>

                  <div className="flex min-w-0 flex-1 items-center justify-between gap-2">
                    <p
                      className={cn(
                        "text-sm font-medium text-foreground transition-opacity",
                        !pdfProvider && "opacity-50"
                      )}
                    >
                      {t("dashboard.resumes.importDialog.pdfTitle")}
                    </p>
                    <ModelMeta provider={pdfProvider} label={modelLabel} />
                  </div>

                  <ChevronRight
                    className={cn(
                      "h-4 w-4 shrink-0 text-muted-foreground/45 transition-all duration-150",
                      pdfProvider
                        ? "group-hover:translate-x-0.5 group-hover:text-foreground/75"
                        : "opacity-35"
                    )}
                  />
                </button>
              </div>
            </div>

            {isImporting && (
              <div className="flex items-center gap-2 pt-1 text-xs text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                <span>{t("dashboard.resumes.importDialog.importing")}</span>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
