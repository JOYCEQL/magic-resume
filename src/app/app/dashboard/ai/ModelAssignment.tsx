import { FileScan, PenLine, Cpu, Sparkles, CircleSlash } from "lucide-react";
import { useTranslations } from "@/i18n/compat/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import {
  AI_PROVIDERS,
  AI_PROVIDER_DEFINITIONS,
  canModelParsePdf,
  isModelConfigured,
  modelDisplayName,
  type AISettingsData,
} from "@/config/ai-models";
import { cn } from "@/lib/utils";
import { ProviderMark } from "./ProviderMark";

interface Props extends AISettingsData {
  onAssign: (task: "text" | "pdf", id: string | null) => void;
}

const PREVIEW_PROVIDERS = ["openai", "gemini", "deepseek", "anthropic"] as const;

export function ModelAssignment({
  models,
  textModelId,
  pdfModelId,
  onAssign,
}: Props) {
  const t = useTranslations("dashboard.settings.ai.workspace");

  return (
    <section
      className="grid gap-4 sm:grid-cols-2"
      aria-label={t("assignments")}
    >
      {(["text", "pdf"] as const).map((task) => {
        const options = models.filter(
          (model) =>
            isModelConfigured(model) &&
            !model.needsReauth &&
            (task === "text" || canModelParsePdf(model)),
        );
        const selectedId = task === "text" ? textModelId : pdfModelId;
        const selectedModel = models.find((m) => m.id === selectedId);
        const Icon = task === "text" ? PenLine : FileScan;
        const needsReauth = selectedModel?.needsReauth === true;
        const isAssigned = !!selectedId && !needsReauth;

        return (
          <article
            key={task}
            className={cn(
              "min-w-0 rounded-2xl border bg-white/90 p-5 sm:p-6 shadow-[0_1px_2px_rgba(28,28,24,0.03),0_6px_20px_rgba(28,28,24,0.02)] transition-colors dark:bg-card",
              isAssigned ? "border-border" : "border-border/80",
            )}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <div
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border transition-colors",
                    isAssigned
                      ? "border-border/80 bg-secondary/75 text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.65)] dark:bg-secondary/60 dark:shadow-none"
                      : "border-border/60 bg-secondary/50 text-muted-foreground",
                  )}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <h2 className="truncate font-sans text-base font-semibold tracking-tight text-foreground">
                  {t(`${task}Title`)}
                </h2>
              </div>

              {/* Right Header Status Badge */}
              {needsReauth ? (
                <span className="rounded-full border border-destructive/30 bg-destructive/5 px-2.5 py-1 text-[11px] text-destructive">
                  {t("orca.reauthRequired")}
                </span>
              ) : isAssigned ? (
                <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  {t("active")}
                </span>
              ) : !options.length ? (
                <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border/70 bg-secondary/50 px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
                  <Sparkles className="h-3 w-3 shrink-0" />
                  <span>{t(task === "pdf" ? "noPdfModels" : "noModels")}</span>
                </span>
              ) : null}
            </div>

            <div className="mt-4">
              <Select
                value={selectedId ?? "none"}
                onValueChange={(value) =>
                  onAssign(task, value === "none" ? null : value)
                }
              >
                <SelectTrigger
                  aria-label={t(`${task}Change`)}
                  className={cn(
                    "h-11 min-w-0 rounded-xl border border-border/80 bg-background/65 px-3 text-sm font-medium shadow-[inset_0_1px_2px_rgba(28,28,24,0.025)] transition-[background-color,border-color,box-shadow] duration-150 motion-reduce:transition-none",
                    "hover:border-foreground/25 hover:bg-background focus:border-foreground/30 focus:ring-2 focus:ring-foreground/10 focus:ring-offset-0 data-[state=open]:border-foreground/30 data-[state=open]:bg-background",
                    !selectedId && "text-muted-foreground font-normal",
                  )}
                >
                  <div className="flex min-w-0 flex-1 items-center justify-between gap-2 pr-1.5">
                    <div className="flex min-w-0 items-center gap-2.5 truncate">
                      {selectedId ? (
                        <>
                          {selectedModel ? (
                            <ProviderMark
                              provider={selectedModel.provider}
                              size="sm"
                            />
                          ) : (
                            <span
                              aria-hidden="true"
                              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-border/60 bg-white text-muted-foreground dark:bg-secondary/80"
                            >
                              <Cpu className="h-3.5 w-3.5" />
                            </span>
                          )}
                          <span className="truncate text-foreground">
                            {selectedModel
                              ? modelDisplayName(selectedModel)
                              : selectedId}
                          </span>
                        </>
                      ) : (
                        <>
                          <span
                            aria-hidden="true"
                            className="flex shrink-0 items-center -space-x-1.5"
                          >
                            {PREVIEW_PROVIDERS.map((providerKey) => (
                              <ProviderMark
                                key={providerKey}
                                provider={providerKey}
                                size="xs"
                                className="h-5 w-5 rounded-full border-border/70 bg-white ring-1 ring-white dark:bg-secondary dark:ring-card [&_img]:h-2.5 [&_img]:w-2.5"
                              />
                            ))}
                          </span>
                          <span className="truncate text-muted-foreground">
                            {t("unassigned")}
                          </span>
                        </>
                      )}
                    </div>

                    {selectedModel && (
                      <span
                        aria-hidden="true"
                        className="hidden sm:inline-flex shrink-0 items-center rounded-md bg-secondary/70 px-2 py-0.5 text-[11px] font-normal text-muted-foreground"
                      >
                        {AI_PROVIDER_DEFINITIONS[selectedModel.provider].name}
                      </span>
                    )}
                  </div>
                </SelectTrigger>
                <SelectContent className="rounded-xl border-border/80 bg-popover p-0 shadow-[0_4px_8px_rgba(28,28,24,0.06),0_12px_32px_rgba(28,28,24,0.1)]">
                  <SelectItem
                    value="none"
                    className="rounded-lg py-2 pl-2 pr-8 text-xs text-muted-foreground hover:text-foreground [&>span:first-child]:left-auto [&>span:first-child]:right-2.5"
                  >
                    <div className="flex items-center gap-2.5">
                      <span
                        aria-hidden="true"
                        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-dashed border-border/80 bg-background/60 text-muted-foreground/70"
                      >
                        <CircleSlash className="h-3.5 w-3.5" />
                      </span>
                      <span>{t("unassigned")}</span>
                    </div>
                  </SelectItem>
                  {options.map((model) => (
                    <SelectItem
                      key={model.id}
                      value={model.id}
                      className="rounded-lg py-2 pl-2 pr-8 text-xs font-medium [&>span:first-child]:left-auto [&>span:first-child]:right-2.5"
                    >
                      <div className="flex items-center gap-2.5">
                        <ProviderMark provider={model.provider} size="sm" />
                        <span className="truncate">
                          {modelDisplayName(model)}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </article>
        );
      })}
    </section>
  );
}
