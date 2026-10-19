import { useEffect, useRef, useState } from "react";
import { FileText, Loader2, Upload } from "lucide-react";
import { useTranslations } from "@/i18n/compat/client";
import {
  isModelConfigured,
  modelDisplayName,
  toAIConnection,
  type AIModelProfile,
} from "@/config/ai-models";
import { MAX_MARKDOWN_CHARACTERS } from "@/config/markdown-import";
import { readMarkdownFile } from "@/lib/markdown-import";
import {
  pdfImportErrorMessage,
  requestMarkdownImport,
} from "@/lib/pdf-import-client";
import {
  ResumeImportError,
  validateResume,
  type ImportedResumeContent,
} from "@/lib/resume-import-schema";
import { ProviderMark } from "@/app/app/dashboard/ai/ProviderMark";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  connection: AIModelProfile | null;
  onOpenChange: (open: boolean) => void;
  onConfigure: () => void;
  onParsed: (
    content: ImportedResumeContent,
    fileName: string,
    warnings: string[]
  ) => void;
};

export function MarkdownImportDialog({
  open,
  connection,
  onOpenChange,
  onConfigure,
  onParsed,
}: Props) {
  const t = useTranslations();
  const [text, setText] = useState("");
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState("");
  const [isParsing, setIsParsing] = useState(false);
  const [isReadingFile, setIsReadingFile] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const activeRequest = useRef<AbortController | null>(null);
  const fileRevision = useRef(0);

  useEffect(
    () => () => {
      activeRequest.current?.abort();
      fileRevision.current++;
    },
    []
  );

  const close = () => {
    activeRequest.current?.abort();
    activeRequest.current = null;
    fileRevision.current++;
    setIsParsing(false);
    setIsReadingFile(false);
    onOpenChange(false);
  };

  const parse = async () => {
    if (isParsing || isReadingFile || !isModelConfigured(connection)) return;
    const controller = new AbortController();
    activeRequest.current = controller;
    setIsParsing(true);
    setError("");
    try {
      const data = await requestMarkdownImport(
        toAIConnection(connection),
        text,
        controller.signal
      );
      if (activeRequest.current !== controller || controller.signal.aborted)
        return;
      const parsed = validateResume(data.resume);
      onParsed(
        parsed.resume,
        fileName || t("dashboard.resumes.importDialog.markdownDefaultTitle"),
        parsed.warnings
      );
      onOpenChange(false);
    } catch (error) {
      if (
        activeRequest.current === controller &&
        !(error instanceof ResumeImportError && error.code === "cancelled")
      ) {
        setError(pdfImportErrorMessage(error, t));
      }
    } finally {
      if (activeRequest.current === controller) {
        activeRequest.current = null;
        setIsParsing(false);
      }
    }
  };

  const configured = isModelConfigured(connection);
  const isOverLimit = text.length > MAX_MARKDOWN_CHARACTERS;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) close();
      }}
    >
      <DialogContent
        aria-describedby={undefined}
        className="flex max-h-[90dvh] flex-col gap-0 overflow-hidden border border-border/80 bg-background p-6 shadow-[0_24px_64px_-16px_rgba(28,28,24,0.14)] dark:border-border/70 dark:shadow-[0_24px_64px_-16px_rgba(0,0,0,0.65)] sm:max-w-[600px] sm:rounded-2xl"
      >
        <DialogHeader className="text-left">
          <DialogTitle className="text-lg font-semibold tracking-tight text-foreground">
            {t("dashboard.resumes.importDialog.markdownTitle")}
          </DialogTitle>
        </DialogHeader>

        <input
          ref={inputRef}
          type="file"
          accept=".md,.markdown,text/markdown,text/plain"
          className="hidden"
          onChange={async (event) => {
            const file = event.target.files?.[0];
            event.target.value = "";
            if (!file || isParsing) return;
            const revision = ++fileRevision.current;
            setIsReadingFile(true);
            try {
              const content = await readMarkdownFile(file);
              if (revision !== fileRevision.current) return;
              setText(content);
              setFileName(file.name.replace(/\.[^.]+$/, ""));
              setError("");
            } catch (error) {
              if (revision === fileRevision.current)
                setError(pdfImportErrorMessage(error, t));
            } finally {
              if (revision === fileRevision.current) setIsReadingFile(false);
            }
          }}
        />

        {/* Unified Editor Card */}
        <div className="mt-4 flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-border/80 bg-white dark:border-border/70 dark:bg-card">
          {/* Editor Header Bar */}
          <div className="flex items-center justify-between gap-3 border-b border-border/60 bg-secondary/35 px-3.5 py-2 dark:border-border/60 dark:bg-secondary/25">
            <div className="flex min-w-0 items-center gap-2">
              <label
                htmlFor="markdown-resume-text"
                className="shrink-0 text-xs font-medium text-muted-foreground"
              >
                {t("dashboard.resumes.importDialog.markdownTextLabel")}
              </label>
              {fileName && (
                <span className="inline-flex min-w-0 items-center gap-1 rounded-md border border-border/70 bg-white px-2 py-0.5 text-[11px] font-medium text-foreground/80 dark:bg-secondary">
                  <FileText className="h-3 w-3 shrink-0 text-muted-foreground" />
                  <span className="truncate">{fileName}.md</span>
                </span>
              )}
            </div>

            <button
              type="button"
              disabled={isParsing || isReadingFile}
              onClick={() => inputRef.current?.click()}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-border/80 bg-white px-2.5 py-1 text-xs font-medium text-foreground shadow-[0_1px_2px_rgba(28,28,24,0.03)] transition-colors hover:bg-secondary/60 disabled:opacity-50 dark:border-border/70 dark:bg-secondary/80 dark:hover:bg-secondary"
            >
              <Upload className="h-3 w-3 text-muted-foreground" />
              <span>{t("dashboard.resumes.importDialog.markdownUpload")}</span>
            </button>
          </div>

          {/* Textarea */}
          <Textarea
            id="markdown-resume-text"
            value={text}
            disabled={isParsing || isReadingFile}
            placeholder={t(
              "dashboard.resumes.importDialog.markdownPlaceholder"
            )}
            className="min-h-[240px] flex-1 resize-none rounded-none border-0 bg-transparent px-4 py-3 font-mono text-[13px] leading-relaxed shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 sm:min-h-[280px]"
            onChange={(event) => {
              fileRevision.current++;
              setText(event.target.value);
              setError("");
            }}
          />

          {/* Editor Status Footer */}
          <div className="flex items-center justify-between gap-3 border-t border-border/50 bg-secondary/20 px-3.5 py-2 text-xs text-muted-foreground dark:border-border/50 dark:bg-secondary/15">
            <div className="flex min-w-0 items-center gap-1.5">
              {isParsing ? (
                <p
                  role="status"
                  className="flex items-center gap-1.5 text-xs font-medium text-foreground/80"
                >
                  <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-primary" />
                  <span className="truncate">
                    {t("dashboard.resumes.importDialog.markdownParsing")}
                  </span>
                </p>
              ) : configured && connection ? (
                <>
                  <ProviderMark
                    provider={connection.provider}
                    size="xs"
                    className="h-3.5 w-3.5 border-0 bg-transparent shadow-none dark:bg-transparent"
                  />
                  <span className="truncate text-foreground/75">
                    {modelDisplayName(connection)}
                  </span>
                </>
              ) : (
                <>
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-red-500 dark:bg-red-400" />
                  <span className="truncate font-medium text-red-600 dark:text-red-400">
                    {t("dashboard.resumes.importDialog.modelNotConfigured")}
                  </span>
                </>
              )}
            </div>

            <span
              className={cn(
                "shrink-0 font-mono text-[11px] tabular-nums",
                isOverLimit
                  ? "font-medium text-red-600 dark:text-red-400"
                  : "text-muted-foreground/75"
              )}
            >
              {text.length.toLocaleString()} /{" "}
              {MAX_MARKDOWN_CHARACTERS.toLocaleString()}
            </span>
          </div>
        </div>

        {error && (
          <p
            role="alert"
            className="mt-3 text-xs font-medium text-red-600 dark:text-red-400"
          >
            {error}
          </p>
        )}

        <DialogFooter className="mt-5 flex-row justify-end gap-2 sm:space-x-0">
          <Button
            type="button"
            variant="outline"
            onClick={close}
            className="h-9 rounded-xl border-border/80 bg-white px-4 text-xs font-medium hover:bg-secondary/60 dark:bg-card"
          >
            {t(
              isParsing
                ? "dashboard.resumes.importDialog.cancelParsing"
                : "dashboard.resumes.importDialog.cancelImport"
            )}
          </Button>
          {configured ? (
            <Button
              type="button"
              disabled={
                isParsing || isReadingFile || !text.trim() || isOverLimit
              }
              onClick={() => void parse()}
              className="h-9 rounded-xl px-4 text-xs font-medium"
            >
              {t("dashboard.resumes.importDialog.markdownParse")}
            </Button>
          ) : (
            <Button
              type="button"
              onClick={() => {
                close();
                onConfigure();
              }}
              className="h-9 rounded-xl px-4 text-xs font-medium"
            >
              {t("dashboard.resumes.importDialog.configure")}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
