import { useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  AlertCircle,
  Brain,
  CheckCircle2,
  ChevronDown,
  ChevronsDownUp,
  ChevronsUpDown,
  Clock3,
  ExternalLink,
  Loader2,
  Square,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Translator } from "@/i18n/compat/utils";
import { useResumeAgentLayoutStore } from "@/store/useResumeAgentLayoutStore";
import {
  computeTimelineStats,
  useResumeAgentTimelineStore,
} from "@/store/useResumeAgentTimelineStore";
import type { ResumeAgentRuntime } from "@/types/resume-agent";
import type { AgentRunState } from "@/types/resume-agent-ui";
import { AgentTimeline } from "./AgentTimeline";
import { useLiveClock } from "./useLiveClock";

interface AgentTraceBlockProps {
  t: Translator;
  runState: AgentRunState;
  isRunning: boolean;
  /** 本轮运行的开始时间；运行中由内部秒表推算已用秒数 */
  startedAt?: number;
  runtime: ResumeAgentRuntime;
  /** 是否采集并展示模型思考过程；下一次运行才生效 */
  showReasoning: boolean;
  onToggleReasoning: () => void;
  /** 跳到右侧完整轨迹 Tab */
  onOpenFullTrace: () => void;
}

const HEADER_ICON: Record<AgentRunState, typeof Activity> = {
  idle: Activity,
  running: Loader2,
  waiting_user: Clock3,
  completed: CheckCircle2,
  error: AlertCircle,
  timeout: AlertCircle,
  cancelled: Square,
};

const HEADER_ICON_CLASS: Record<AgentRunState, string> = {
  idle: "text-muted-foreground",
  running: "animate-spin text-primary",
  waiting_user: "text-amber-600 dark:text-amber-500",
  completed: "text-emerald-600 dark:text-emerald-500",
  error: "text-destructive",
  timeout: "text-destructive",
  cancelled: "text-muted-foreground",
};

export const AgentTraceBlock = ({
  t,
  runState,
  isRunning,
  startedAt,
  runtime,
  showReasoning,
  onToggleReasoning,
  onOpenFullTrace,
}: AgentTraceBlockProps) => {
  const steps = useResumeAgentTimelineStore((state) => state.steps);
  const collapseAll = useResumeAgentTimelineStore((state) => state.collapseAll);
  const expandAll = useResumeAgentTimelineStore((state) => state.expandAll);
  const collapsed = useResumeAgentLayoutStore((state) => state.traceBlockCollapsed);
  const toggleTraceBlock = useResumeAgentLayoutStore((state) => state.toggleTraceBlock);
  const stats = useMemo(() => computeTimelineStats(steps), [steps]);

  // 秒表只在有步骤在跑时开启；秒级 tick 不会重渲染整个 page
  const now = useLiveClock(isRunning);
  const elapsedSeconds =
    isRunning && startedAt ? Math.max(0, Math.floor((now - startedAt) / 1000)) : 0;

  if (!isRunning && !steps.length) return null;

  const HeaderIcon = HEADER_ICON[runState];
  const headline = isRunning
    ? t("trace.running", { seconds: elapsedSeconds })
    : runState === "waiting_user"
      ? t("trace.waiting")
      : runState === "completed"
        ? t("trace.completed", { count: stats.total })
        : runState === "timeout"
          ? t("trace.timeout")
          : runState === "cancelled"
            ? t("trace.cancelled")
            : runState === "error"
              ? t("trace.failed")
              : t("trace.title");

  return (
    <div className="overflow-hidden rounded-xl border bg-muted/15">
      <button
        type="button"
        onClick={toggleTraceBlock}
        aria-expanded={!collapsed}
        aria-controls="agent-trace-body"
        className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left transition hover:bg-muted/30"
      >
        <span className="flex min-w-0 items-center gap-2 text-xs text-muted-foreground">
          <HeaderIcon
            aria-hidden
            className={cn("h-3.5 w-3.5 shrink-0", HEADER_ICON_CLASS[runState])}
          />
          <span className="truncate">{headline}</span>
          {stats.failed > 0 && (
            <Badge variant="destructive" className="h-4 shrink-0 px-1.5 text-[10px] font-normal">
              {t("trace.failedCount", { count: stats.failed })}
            </Badge>
          )}
        </span>
        <span className="flex shrink-0 items-center gap-2">
          <Badge
            variant="outline"
            className="h-5 px-1.5 text-[10px] font-normal text-muted-foreground"
          >
            {runtime === "native"
              ? t("trace.native")
              : runtime === "opencode"
                ? t("trace.opencode")
                : t("trace.compatible")}
          </Badge>
          <ChevronDown
            aria-hidden
            className={cn(
              "h-3.5 w-3.5 text-muted-foreground transition-transform",
              !collapsed && "rotate-180"
            )}
          />
        </span>
      </button>

      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.div
            key="trace-body"
            id="agent-trace-body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div className="border-t px-3 py-2">
              <div className="mb-1 flex flex-wrap items-center justify-between gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onToggleReasoning}
                  className={cn(
                    "h-6 gap-1 px-1.5 text-[10px]",
                    showReasoning ? "text-primary" : "text-muted-foreground"
                  )}
                  title={t("trace.reasoningHint")}
                >
                  <Brain className="h-3 w-3" />
                  {showReasoning ? t("trace.reasoningOn") : t("trace.reasoningOff")}
                </Button>
                {steps.length > 1 && (
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={expandAll}
                      className="h-6 gap-1 px-1.5 text-[10px] text-muted-foreground"
                    >
                      <ChevronsUpDown className="h-3 w-3" />
                      {t("trace.expandAll")}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={collapseAll}
                      className="h-6 gap-1 px-1.5 text-[10px] text-muted-foreground"
                    >
                      <ChevronsDownUp className="h-3 w-3" />
                      {t("trace.collapseAll")}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={onOpenFullTrace}
                      className="h-6 gap-1 px-1.5 text-[10px] text-muted-foreground"
                    >
                      <ExternalLink className="h-3 w-3" />
                      {t("trace.openFull")}
                    </Button>
                  </div>
                )}
              </div>
              <AgentTimeline t={t} isRunning={isRunning} />
              <p className="pt-1.5 text-[10px] leading-4 text-muted-foreground/70">
                {showReasoning ? t("trace.reasoningNote") : t("trace.privacyNote")}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
