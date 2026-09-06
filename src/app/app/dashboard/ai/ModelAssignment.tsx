import { FileText, PenLine, Cpu, Sparkles, CheckCircle2 } from "lucide-react";
import { useTranslations } from "@/i18n/compat/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
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
              "group relative overflow-hidden rounded-2xl border bg-card/50 p-5 shadow-[0_2px_10px_rgba(0,0,0,0.02)] backdrop-blur-sm transition-all duration-300",
              isAssigned
                ? "border-border/90 hover:border-foreground/20 hover:shadow-[0_4px_20px_rgba(0,0,0,0.05)]"
                : "border-border/60 hover:border-border",
            )}
          >
            {/* Top delicate atmosphere gradient */}
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-foreground/[0.08] to-transparent" />

            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3.5">
                <div
                  className={cn(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition-all duration-300",
                    isAssigned
                      ? "border-border/80 bg-background text-foreground shadow-[0_1px_3px_rgba(0,0,0,0.04)]"
                      : "border-border/50 bg-muted/30 text-muted-foreground",
                  )}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-semibold tracking-tight text-foreground">
                      {t(`${task}Title`)}
                    </h2>
                    {isAssigned && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                        <span className="h-1 w-1 rounded-full bg-emerald-500" />
                        Active
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
                    "h-11 rounded-xl border bg-background/80 text-sm font-medium transition-all duration-200",
                    "hover:bg-background hover:border-foreground/20 focus:ring-1 focus:ring-foreground/20",
                    !selectedId && "text-muted-foreground font-normal",
                  )}
                >
                  <div className="flex items-center gap-2 truncate">
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
                <SelectContent className="rounded-xl border-border/80 p-1 shadow-lg">
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
              <div className="mt-2.5 flex items-center gap-1.5 text-xs text-amber-600/90 dark:text-amber-400/90">
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
