import { useEffect, useState } from "react";
import { Check, ChevronDown, Cpu, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useTranslations } from "@/i18n/compat/client";
import { cn } from "@/lib/utils";
import { formatContextLength } from "@/config/orcarouter";
import type { OrcaOptionModel } from "@/lib/orcarouter/catalog";

interface Props {
  models: OrcaOptionModel[];
  totalCount: number;
  status: "idle" | "ready" | "error";
  selectedId: string;
  onSelect: (id: string) => void;
  query: string;
  onQueryChange: (value: string) => void;
  loading: boolean;
}

export function OrcaModelSelector({
  models,
  totalCount,
  status,
  selectedId,
  onSelect,
  query,
  onQueryChange,
  loading,
}: Props) {
  const t = useTranslations("dashboard.settings.ai.workspace.orca");
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (loading || status !== "ready") setOpen(false);
  }, [loading, status]);

  return (
    <div
      data-testid="orca-model-selector"
      data-source={status === "ready" ? "live" : status}
      className="mb-5"
    >
      <button
        type="button"
        data-testid="orca-model-dropdown-trigger"
        disabled={loading || status !== "ready"}
        aria-expanded={open}
        onClick={() => {
          if (!open) onQueryChange("");
          setOpen(!open);
        }}
        className={cn(
          "flex h-11 w-full items-center justify-between gap-3 rounded-xl border border-border/80 bg-background/65 px-3.5 text-left text-sm shadow-[inset_0_1px_2px_rgba(28,28,24,0.025)] transition-[background-color,border-color,box-shadow] duration-150",
          "hover:border-foreground/25 hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/15 disabled:cursor-not-allowed disabled:opacity-60",
          open && "border-foreground/30 bg-background ring-2 ring-foreground/10",
        )}
      >
        <span className="flex min-w-0 items-center gap-2.5">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-border/60 bg-white text-muted-foreground shadow-2xs dark:bg-secondary/80">
            <Cpu className="h-3.5 w-3.5" />
          </span>
          <span
            className={cn(
              "truncate font-mono text-xs",
              selectedId ? "font-medium text-foreground" : "text-muted-foreground",
            )}
          >
            {selectedId || t("modelPlaceholder")}
          </span>
        </span>

        <span className="flex shrink-0 items-center gap-2">
          <span
            data-testid="orca-catalog-source-badge"
            className={cn(
              "hidden rounded-md px-2 py-0.5 text-[10px] font-medium sm:inline-flex",
              status === "ready"
                ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                : "bg-secondary/80 text-muted-foreground",
            )}
          >
            {status === "ready"
              ? t("catalogCount", { count: totalCount })
              : t(`catalogStatus.${status}`)}
          </span>
          <ChevronDown
            className={cn(
              "h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-150",
              open && "rotate-180 text-foreground",
            )}
          />
        </span>
      </button>

      {status === "error" && (
        <p role="alert" className="mt-2 text-xs text-destructive">
          {t("catalogFailed")}
        </p>
      )}

      {open && status === "ready" && (
        <div
          data-testid="orca-model-dropdown"
          data-open="true"
          className="mt-2 overflow-hidden rounded-xl border border-border/80 bg-popover shadow-[0_4px_12px_rgba(28,28,24,0.06),0_16px_32px_rgba(28,28,24,0.08)]"
        >
          <div className="relative border-b border-border/60 bg-secondary/25 p-2.5">
            <Search className="pointer-events-none absolute left-5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              data-testid="orca-model-search"
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
              placeholder={t("modelSearch")}
              className="h-8 rounded-lg border-border/70 bg-background/90 pl-8 text-xs"
            />
          </div>
          <div className="max-h-64 divide-y divide-border/40 overflow-y-auto p-1">
            {models.length === 0 && (
              <p className="px-3 py-6 text-center text-xs text-muted-foreground">
                {t("modelEmpty")}
              </p>
            )}
            {models.map((model) => {
              const isSelected = model.id === selectedId;
              const ctxLabel = formatContextLength(model.contextLength);
              return (
                <button
                  key={model.id}
                  type="button"
                  data-testid="orca-model-option"
                  onClick={() => {
                    onSelect(model.id);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left transition-colors hover:bg-accent/60",
                    isSelected && "bg-accent/50",
                  )}
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-mono text-xs font-medium text-foreground">
                      {model.id}
                    </span>
                    {model.description && (
                      <span className="mt-0.5 block truncate text-[11px] text-muted-foreground">
                        {model.description}
                      </span>
                    )}
                  </span>

                  <span className="flex shrink-0 items-center gap-1.5">
                    {ctxLabel && (
                      <span className="rounded bg-secondary/70 px-1.5 py-0.5 font-mono text-[10px] tabular-nums text-muted-foreground">
                        {ctxLabel}
                      </span>
                    )}
                    {model.supportsImages && (
                      <span className="rounded border border-primary/20 bg-primary/5 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                        {t("capabilityImage")}
                      </span>
                    )}
                    {isSelected && (
                      <Check className="ml-1 h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
