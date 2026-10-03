import { FileText, PenLine, Cpu, Sparkles } from "lucide-react";
import { useTranslations } from "@/i18n/compat/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import {
  canModelParsePdf,
  isModelConfigured,
  modelDisplayName,
  type AISettingsData,
} from "@/config/ai-models";
import { cn } from "@/lib/utils";

interface Props extends AISettingsData {
  onAssign: (task: "text" | "pdf", id: string | null) => void;
}

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
            (task === "text" || canModelParsePdf(model)),
        );
        const selectedId = task === "text" ? textModelId : pdfModelId;
        const selectedModel = models.find((m) => m.id === selectedId);
        const Icon = task === "text" ? PenLine : FileText;
        const isAssigned = !!selectedId;

        return (
          <article
            key={task}
            className={cn(
              "min-w-0 rounded-xl border bg-white/85 p-5 shadow-[0_1px_2px_rgba(28,28,24,0.035),0_4px_12px_rgba(28,28,24,0.02)] dark:bg-card",
              isAssigned
                ? "border-border"
                : "border-border/70",
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3.5">
                <div
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                    isAssigned
                      ? "bg-secondary/70 text-foreground"
                      : "bg-secondary/40 text-muted-foreground",
                  )}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-sans text-sm font-semibold tracking-tight text-foreground">
                      {t(`${task}Title`)}
                    </h2>
                    {isAssigned && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                        <span className="h-1 w-1 rounded-full bg-emerald-500" />
                        {t("active")}
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {t(`${task}Description`)}
                  </p>
                </div>
              </div>
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
                    "h-10 min-w-0 rounded-lg border border-border/80 bg-background/70 text-sm font-medium shadow-[inset_0_1px_2px_rgba(28,28,24,0.025)] transition-[background-color,border-color,box-shadow] duration-150 motion-reduce:transition-none",
                    "hover:border-foreground/25 hover:bg-background focus:border-foreground/30 focus:ring-2 focus:ring-foreground/10 focus:ring-offset-0 data-[state=open]:border-foreground/30 data-[state=open]:bg-background",
                    !selectedId && "text-muted-foreground font-normal",
                  )}
                >
                  <div className="flex min-w-0 items-center gap-2 truncate">
                    {selectedId ? (
                      <>
                        <Cpu className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                        <span className="truncate">
                          {selectedModel ? modelDisplayName(selectedModel) : selectedId}
                        </span>
                      </>
                    ) : (
                      <span className="text-muted-foreground">
                        {t("unassigned")}
                      </span>
                    )}
                  </div>
                </SelectTrigger>
                <SelectContent className="rounded-xl border-border/80 bg-popover p-1 shadow-[0_4px_8px_rgba(28,28,24,0.06),0_12px_32px_rgba(28,28,24,0.1)]">
                  <SelectItem
                    value="none"
                    className="rounded-lg text-xs text-muted-foreground hover:text-foreground"
                  >
                    {t("unassigned")}
                  </SelectItem>
                  {options.map((model) => (
                    <SelectItem
                      key={model.id}
                      value={model.id}
                      className="rounded-lg font-medium text-xs py-2"
                    >
                      <div className="flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-primary/40" />
                        <span>{modelDisplayName(model)}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {!options.length && (
              <div className="mt-2.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                <Sparkles className="h-3 w-3 shrink-0" />
                <span>{t(task === "pdf" ? "noPdfModels" : "noModels")}</span>
              </div>
            )}
          </article>
        );
      })}
    </section>
  );
}
