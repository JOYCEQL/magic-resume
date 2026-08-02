import { useCallback, useEffect, useMemo, useRef } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Translator } from "@/i18n/compat/utils";
import {
  groupSteps,
  isStepExpanded,
  useResumeAgentTimelineStore,
} from "@/store/useResumeAgentTimelineStore";
import { AgentStepItem } from "./AgentStepItem";
import { useLiveClock } from "./useLiveClock";

interface AgentTimelineProps {
  t: Translator;
  /** 有步骤在跑时才开秒表 */
  isRunning: boolean;
  /** 新步骤追加后滚到底部；左侧折叠块不开，否则会抢走对话区滚动 */
  autoScroll?: boolean;
  emptyHint?: string;
  className?: string;
}

export const AgentTimeline = ({
  t,
  isRunning,
  autoScroll = false,
  emptyHint,
  className,
}: AgentTimelineProps) => {
  const steps = useResumeAgentTimelineStore((state) => state.steps);
  const expandedOverrides = useResumeAgentTimelineStore((state) => state.expandedOverrides);
  const toggleStep = useResumeAgentTimelineStore((state) => state.toggleStep);
  const now = useLiveClock(isRunning);
  const bottomRef = useRef<HTMLDivElement>(null);

  const { topLevel, childrenByParent } = useMemo(() => groupSteps(steps), [steps]);

  const getChildren = useCallback(
    (parentId: string) => childrenByParent.get(parentId) ?? [],
    [childrenByParent]
  );
  const isExpanded = useCallback(
    (id: string) => isStepExpanded({ steps, expandedOverrides }, id),
    [expandedOverrides, steps]
  );

  const lastStepId = steps.at(-1)?.id;
  useEffect(() => {
    if (!autoScroll || !lastStepId) return;
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [autoScroll, lastStepId]);

  if (!steps.length) {
    if (isRunning) {
      return (
        <div className={cn("flex items-center gap-2 text-xs text-muted-foreground", className)}>
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          {t("thinking")}
        </div>
      );
    }
    return emptyHint ? (
      <p className={cn("text-xs text-muted-foreground", className)}>{emptyHint}</p>
    ) : null;
  }

  return (
    <div className={className}>
      <ul className="space-y-0.5">
        {topLevel.map((step) => (
          <AgentStepItem
            key={step.id}
            step={step}
            getChildren={getChildren}
            isExpanded={isExpanded}
            onToggle={toggleStep}
            now={now}
            t={t}
          />
        ))}
      </ul>
      <div ref={bottomRef} />
    </div>
  );
};
