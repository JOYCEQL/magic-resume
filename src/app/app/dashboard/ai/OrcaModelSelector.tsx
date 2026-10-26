import { useState } from "react";
import { Check, ChevronDown, Loader2, RefreshCw, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useTranslations } from "@/i18n/compat/client";
import { cn } from "@/lib/utils";
import { formatContextLength } from "@/config/orcarouter";
import type { OrcaOptionModel } from "@/lib/orcarouter/catalog";

interface Props {
  models: OrcaOptionModel[];
  status: "idle" | "ready" | "error";
  selectedId: string;
  onSelect: (id: string) => void;
  query: string;
  onQueryChange: (value: string) => void;
  loading: boolean;
  onRefresh?: () => void;
}

export function OrcaModelSelector({
  models,
  status,
  selectedId,
  onSelect,
  query,
  onQueryChange,
  loading,
  onRefresh,
}: Props) {
  const t = useTranslations("dashboard.settings.ai.workspace.orca");
  const [open, setOpen] = useState(false);

  return (
    <div
      data-testid="orca-model-selector"
      data-source={status === "ready" ? "live" : status}
      className="mb-5 rounded-xl border border-border/70 bg-background/60 p-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <h4 className="font-sans text-sm font-semibold">{t("modelSelectorTitle")}</h4>
          <span
            data-testid="orca-catalog-source-badge"
            className={cn(
              "rounded-md px-2 py-0.5 text-[10px]",
              status === "ready"
                ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                : "bg-amber-500/10 text-amber-700 dark:text-amber-400",
            )}
          >
            {t(`catalogStatus.${status}`)}
          </span>
          <span className="text-[11px] text-muted-foreground">
            {t("catalogCount", { count: models.length })}
          </span>
        </div>
        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            className="flex h-7 items-center gap-1.5 rounded-lg px-2 text-[11px] font-medium text-muted-foreground hover:text-foreground disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <RefreshCw className="h-3 w-3" />
            )}
            {t("catalogRefresh")}
          </button>
        )}
      </div>

      <button
        type="button"
        data-testid="orca-model-dropdown-trigger"
        disabled={loading || status !== "ready"}
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        className="mt-3 flex h-10 w-full items-center justify-between rounded-lg border border-border/80 bg-background/70 px-3 text-left text-sm"
      >
        <span className="truncate font-mono text-xs">
          {selectedId || t("modelPlaceholder")}
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 opacity-60 transition-transform",
            open ? "rotate-180" : "",
          )}
        />
      </button>

      {status !== "ready" && (
        <p role={status === "error" ? "alert" : undefined} className="mt-2 text-xs text-muted-foreground">
          {t(status === "error" ? "catalogFailed" : "catalogIdle")}
        </p>
      )}

      {open && status === "ready" && (
        <div
          data-testid="orca-model-dropdown"
          data-open="true"
          className="mt-2 overflow-hidden rounded-lg border border-border/80 bg-white shadow-lg dark:bg-neutral-900"
        >
          <div className="relative border-b border-border/60 p-2">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              data-testid="orca-model-search"
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
              placeholder={t("modelSearch")}
              className="h-8 rounded-md border-border/60 bg-background/70 pl-8 text-xs"
            />
          </div>
          <div className="max-h-64 overflow-y-auto">
            {models.length === 0 && (
              <p className="px-3 py-4 text-center text-xs text-muted-foreground">
                {t("modelEmpty")}
              </p>
            )}
            {models.map((model) => (
              <button
                key={model.id}
                type="button"
                data-testid="orca-model-option"
                onClick={() => {
                  onSelect(model.id);
                  setOpen(false);
                }}
                className={cn(
                  "flex w-full items-center gap-2 border-b border-border/40 px-3 py-2 text-left last:border-b-0 hover:bg-accent/50",
                  model.id === selectedId && "bg-accent/40",
                )}
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-mono text-xs text-foreground">
                    {model.id}
                  </span>
                  <span className="mt-0.5 flex items-center gap-2 text-[10px] text-muted-foreground">
                    {model.description && (
                      <span className="truncate">{model.description}</span>
                    )}
                    {formatContextLength(model.contextLength) && (
                      <span className="shrink-0 tabular-nums">
                        {formatContextLength(model.contextLength)}
                      </span>
                    )}
                    {model.supportsImages && (
                      <span className="shrink-0">{t("capabilityImage")}</span>
                    )}
                  </span>
                </span>
                {model.id === selectedId && (
                  <Check className="h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
