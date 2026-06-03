import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart3,
  Sparkles,
  Loader2,
  RefreshCw,
  AlertCircle,
  KeyRound,
  ArrowRight,
  Check,
  X
} from "lucide-react";
import { useTranslations } from "@/i18n/compat/client";
import { useRouter } from "@/lib/navigation";
import { useResumeStore } from "@/store/useResumeStore";
import { useAIConfigStore } from "@/store/useAIConfigStore";
import { useATSStore } from "@/store/useATSStore";
import { useATSAnalyze } from "@/hooks/useATSAnalyze";
import { ATS_SECTIONS_ORDER, getATSColor, getATSGradient, getATSTier } from "@/lib/ats";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ATSAnalyzerPanelProps {
  onClose?: () => void;
}

export function ATSAnalyzerPanel({ onClose }: ATSAnalyzerPanelProps) {
  const t = useTranslations("atsAnalyzer");
  const router = useRouter();
  const { activeResume } = useResumeStore();
  const { isConfigured } = useAIConfigStore();
  const { isAnalyzing, error, getResult } = useATSStore();
  const { run } = useATSAnalyze();

  const configured = isConfigured();
  const result = getResult(activeResume?.id);

  const sortedSectionIds = useMemo(() => {
    if (!result) return [];
    const ids = Object.keys(result.sections);
    return ids.sort((a, b) => {
      const ai = ATS_SECTIONS_ORDER.indexOf(a as never);
      const bi = ATS_SECTIONS_ORDER.indexOf(b as never);
      return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
    });
  }, [result]);

  const sectionName = (id: string) => {
    const key = `sectionNames.${id}`;
    const translated = t(key);
    return translated.startsWith("atsAnalyzer.") ? id : translated;
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="w-full h-full overflow-y-auto bg-background border-r border-border"
    >
      <div className="sticky top-0 z-10 backdrop-blur-md bg-background/90 border-b border-border/60 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-purple to-brand-orange text-white flex items-center justify-center shadow-sm">
            <BarChart3 className="w-4 h-4" strokeWidth={2} />
          </div>
          <div>
            <div className="text-sm font-semibold text-foreground leading-none">
              {t("title")}
            </div>
            <div className="text-[10px] text-muted-foreground mt-0.5 leading-none">
              {t("subtitle")}
            </div>
          </div>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-md hover:bg-accent/30 flex items-center justify-center text-muted-foreground transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="p-4 space-y-4">
        {!configured ? (
          <MissingConfigEmptyState
            title={t("missingConfig.title")}
            description={t("missingConfig.description")}
            cta={t("missingConfig.cta")}
            onCta={() => router.push("/app/dashboard/ai")}
          />
        ) : isAnalyzing ? (
          <RunningState label={t("running")} />
        ) : error ? (
          <ErrorState
            message={error}
            onRetry={run}
            retryLabel={t("runAgain")}
          />
        ) : !result ? (
          <EmptyState
            title={t("empty.title")}
            description={t("empty.description")}
            cta={t("empty.cta")}
            onCta={run}
          />
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={result.analyzedAt}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <OverallCard
                score={result.overall}
                label={t("overall.label")}
                tierLabels={{
                  excellent: t("overall.tiers.excellent"),
                  good: t("overall.tiers.good"),
                  needsWork: t("overall.tiers.needsWork"),
                  poor: t("overall.tiers.poor")
                }}
                onRerun={run}
                rerunLabel={t("runAgain")}
              />

              <div>
                <div className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-2 px-1">
                  {t("sections.title")}
                </div>
                <div className="space-y-2.5">
                  {sortedSectionIds.map((id) => (
                    <SectionScoreCard
                      key={id}
                      name={sectionName(id)}
                      score={result.sections[id].score}
                      summary={result.sections[id].summary}
                      suggestions={result.sections[id].suggestions}
                      suggestionsLabel={t("suggestions.title")}
                      emptyLabel={t("suggestions.empty")}
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </motion.div>
  );
}

function OverallCard({
  score,
  label,
  tierLabels,
  onRerun,
  rerunLabel
}: {
  score: number;
  label: string;
  tierLabels: Record<"excellent" | "good" | "needsWork" | "poor", string>;
  onRerun: () => void;
  rerunLabel: string;
}) {
  const tier = getATSTier(score);
  const gradient = getATSGradient(score);

  return (
    <div className="relative rounded-2xl border border-border/60 bg-card p-5 overflow-hidden">
      <div className={cn("absolute -top-16 -right-16 w-40 h-40 rounded-full blur-3xl opacity-30 bg-gradient-to-br", gradient)} />

      <div className="relative">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
            {label}
          </span>
          <span className={cn("text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full bg-secondary/80", getATSColor(score))}>
            {tierLabels[tier]}
          </span>
        </div>

        <div className="flex items-end justify-between">
          <div className={cn("text-5xl font-serif font-semibold tracking-tight tabular-nums", getATSColor(score))}>
            {score}
            <span className="text-xl text-muted-foreground/60 font-sans font-normal">/100</span>
          </div>

          <Button
            size="sm"
            variant="ghost"
            onClick={onRerun}
            className="rounded-lg text-xs"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
            {rerunLabel}
          </Button>
        </div>

        <div className="mt-4 h-2 rounded-full bg-muted/60 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${score}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className={cn("h-full rounded-full bg-gradient-to-r", gradient)}
          />
        </div>
      </div>
    </div>
  );
}

function SectionScoreCard({
  name,
  score,
  summary,
  suggestions,
  suggestionsLabel,
  emptyLabel
}: {
  name: string;
  score: number;
  summary: string;
  suggestions: string[];
  suggestionsLabel: string;
  emptyLabel: string;
}) {
  const gradient = getATSGradient(score);

  return (
    <div className="rounded-xl border border-border/60 bg-card p-4 space-y-3">
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <div className="text-sm font-medium text-foreground">{name}</div>
          <div className={cn("text-sm font-semibold tabular-nums", getATSColor(score))}>
            {score}
            <span className="text-xs text-muted-foreground/60 ml-0.5">/100</span>
          </div>
        </div>
        <div className="h-1.5 rounded-full bg-muted/60 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${score}%` }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className={cn("h-full rounded-full bg-gradient-to-r", gradient)}
          />
        </div>
        {summary && (
          <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{summary}</p>
        )}
      </div>

      {suggestions.length > 0 ? (
        <div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-1.5">
            {suggestionsLabel}
          </div>
          <ul className="space-y-1.5">
            {suggestions.map((s, i) => (
              <li key={i} className="flex items-start gap-2 text-xs leading-relaxed">
                <ArrowRight className="w-3 h-3 mt-0.5 shrink-0 text-brand-orange" />
                <span className="text-foreground/80">{s}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400">
          <Check className="w-3.5 h-3.5" />
          <span>{emptyLabel}</span>
        </div>
      )}
    </div>
  );
}

function EmptyState({
  title,
  description,
  cta,
  onCta
}: {
  title: string;
  description: string;
  cta: string;
  onCta: () => void;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-card p-6 text-center space-y-4">
      <div className="mx-auto w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-purple/10 to-brand-orange/10 flex items-center justify-center text-brand-purple">
        <BarChart3 className="w-6 h-6" strokeWidth={1.8} />
      </div>
      <div className="space-y-1.5">
        <div className="font-semibold text-foreground">{title}</div>
        <p className="text-sm text-muted-foreground leading-relaxed font-light">
          {description}
        </p>
      </div>
      <Button
        onClick={onCta}
        className="rounded-xl bg-brand-purple text-white hover:bg-brand-purple/90 shadow-sm shadow-brand-purple/20"
      >
        <Sparkles className="w-4 h-4 mr-1.5" />
        {cta}
      </Button>
    </div>
  );
}

function MissingConfigEmptyState({
  title,
  description,
  cta,
  onCta
}: {
  title: string;
  description: string;
  cta: string;
  onCta: () => void;
}) {
  return (
    <div className="rounded-2xl border border-brand-orange/20 bg-brand-orange/[0.04] p-6 text-center space-y-4">
      <div className="mx-auto w-12 h-12 rounded-2xl bg-brand-orange/10 flex items-center justify-center text-brand-orange">
        <KeyRound className="w-6 h-6" strokeWidth={1.8} />
      </div>
      <div className="space-y-1.5">
        <div className="font-semibold text-foreground">{title}</div>
        <p className="text-sm text-muted-foreground leading-relaxed font-light">
          {description}
        </p>
      </div>
      <Button
        onClick={onCta}
        className="rounded-xl bg-brand-orange text-white hover:bg-brand-orange/90 shadow-sm shadow-brand-orange/20"
      >
        {cta}
        <ArrowRight className="w-4 h-4 ml-1.5" />
      </Button>
    </div>
  );
}

function RunningState({ label }: { label: string }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card p-8 text-center space-y-4">
      <div className="mx-auto w-12 h-12 rounded-2xl bg-brand-purple/10 flex items-center justify-center text-brand-purple">
        <Loader2 className="w-6 h-6 animate-spin" strokeWidth={2} />
      </div>
      <p className="text-sm text-muted-foreground font-light">{label}</p>
    </div>
  );
}

function ErrorState({
  message,
  onRetry,
  retryLabel
}: {
  message: string;
  onRetry: () => void;
  retryLabel: string;
}) {
  return (
    <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-5 space-y-3">
      <div className="flex items-start gap-2.5">
        <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
        <p className="text-sm text-foreground leading-relaxed">{message}</p>
      </div>
      <Button
        size="sm"
        variant="outline"
        onClick={onRetry}
        className="rounded-lg w-full"
      >
        <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
        {retryLabel}
      </Button>
    </div>
  );
}
