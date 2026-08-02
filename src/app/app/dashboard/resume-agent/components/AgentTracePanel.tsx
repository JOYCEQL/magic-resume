import { useMemo } from "react";
import { ChevronsDownUp, ChevronsUpDown, Timer } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Translator } from "@/i18n/compat/utils";
import {
  computeTimelineStats,
  useResumeAgentTimelineStore,
} from "@/store/useResumeAgentTimelineStore";
import { formatDuration } from "../agentStepLabels";
import { AgentTimeline } from "./AgentTimeline";

interface AgentTracePanelProps {
  t: Translator;
  isRunning: boolean;
}

/** 右侧 Tab2：完整执行轨迹。与左侧折叠块共享同一个 timeline store，展开状态也共享。 */
export const AgentTracePanel = ({ t, isRunning }: AgentTracePanelProps) => {
  const steps = useResumeAgentTimelineStore((state) => state.steps);
  const collapseAll = useResumeAgentTimelineStore((state) => state.collapseAll);
  const expandAll = useResumeAgentTimelineStore((state) => state.expandAll);
  const stats = useMemo(() => computeTimelineStats(steps), [steps]);

  return (
    <div className="space-y-3 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="font-normal">
            {t("trace.stepCount", { count: stats.total })}
          </Badge>
          {stats.failed > 0 && (
            <Badge variant="destructive" className="font-normal">
              {t("trace.failedCount", { count: stats.failed })}
            </Badge>
          )}
          {stats.durationMs > 0 && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Timer className="h-3 w-3" />
              {formatDuration(stats.durationMs)}
            </span>
          )}
        </div>
        {steps.length > 1 && (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={expandAll}
              className="h-7 gap-1 px-2 text-[11px] text-muted-foreground"
            >
              <ChevronsUpDown className="h-3 w-3" />
              {t("trace.expandAll")}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={collapseAll}
              className="h-7 gap-1 px-2 text-[11px] text-muted-foreground"
            >
              <ChevronsDownUp className="h-3 w-3" />
              {t("trace.collapseAll")}
            </Button>
          </div>
        )}
      </div>

      <AgentTimeline
        t={t}
        isRunning={isRunning}
        autoScroll
        emptyHint={t("trace.emptyHint")}
        className="rounded-xl border bg-muted/10 p-3"
      />

      <p className="text-[10px] leading-4 text-muted-foreground/70">{t("trace.privacyNote")}</p>
    </div>
  );
};
