import { memo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Brain, ChevronRight, ListChecks } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Translator } from "@/i18n/compat/utils";
import type { AgentTimelineStep } from "@/types/resume-agent-ui";
import {
  formatDuration,
  isReasoningStep,
  isStepOpenEnded,
  resolveStepDetail,
  resolveStepLabel,
  STEP_STATUS_TEXT_CLASS,
} from "../agentStepLabels";
import { AgentChainBadges, AgentChainNode } from "./AgentChainNode";
import { AgentStepIcon } from "./AgentStepIcon";

interface AgentStepItemProps {
  step: AgentTimelineStep;
  getChildren: (parentId: string) => AgentTimelineStep[];
  isExpanded: (id: string) => boolean;
  onToggle: (id: string) => void;
  /** 运行中的步骤用它计算实时耗时 */
  now: number;
  t: Translator;
  depth?: number;
}

const durationOf = (step: AgentTimelineStep, now: number) =>
  step.durationMs ?? (isStepOpenEnded(step.status) ? Math.max(0, now - step.startedAt) : undefined);

const AgentStepItemBase = ({
  step,
  getChildren,
  isExpanded,
  onToggle,
  now,
  t,
  depth = 0,
}: AgentStepItemProps) => {
  const detail = resolveStepDetail(step);
  const childSteps = getChildren(step.id);
  const chain = step.kind === "chain" ? step.chain : undefined;
  // 思维链节点自身就是可展开内容，即使没有 detail / 子步骤也要能展开
  const collapsible = childSteps.length > 0 || Boolean(detail) || Boolean(chain);
  const expanded = isExpanded(step.id);
  const duration = formatDuration(durationOf(step, now));
  const reasoning = isReasoningStep(step);
  /** 折叠态标题显示思考内容摘要，而不是固定文案，一眼看出模型在想什么 */
  const reasoningExcerpt =
    reasoning && step.detail && step.detail.length > 56
      ? `${step.detail.slice(0, 56)}…`
      : step.detail || "";

  return (
    <li className={cn("relative", depth > 0 && "pl-4")}>
      {/* 子步骤缩进导轨 */}
      {depth > 0 && <span aria-hidden className="absolute left-0 top-0 h-full w-px bg-border" />}
      <div
        className={cn(
          "flex items-start gap-2 rounded-md py-1 pr-1 text-xs leading-5",
          collapsible && "cursor-pointer hover:bg-muted/40"
        )}
        role={collapsible ? "button" : undefined}
        tabIndex={collapsible ? 0 : undefined}
        aria-expanded={collapsible ? expanded : undefined}
        onClick={collapsible ? () => onToggle(step.id) : undefined}
        onKeyDown={
          collapsible
            ? (event) => {
                if (event.key !== "Enter" && event.key !== " ") return;
                event.preventDefault();
                onToggle(step.id);
              }
            : undefined
        }
      >
        <ChevronRight
          aria-hidden
          className={cn(
            "mt-0.5 h-3 w-3 shrink-0 text-muted-foreground transition-transform",
            expanded && "rotate-90",
            !collapsible && "invisible"
          )}
        />
        {reasoning ? (
          <Brain aria-hidden className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        ) : chain && chain.verdict === "pending" ? (
          <AgentStepIcon status={step.status} className="mt-0.5" />
        ) : chain ? (
          <ListChecks aria-hidden className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        ) : (
          <AgentStepIcon status={step.status} className="mt-0.5" />
        )}
        <span
          className={cn(
            "min-w-0 flex-1 break-words",
            reasoning ? "italic text-muted-foreground" : STEP_STATUS_TEXT_CLASS[step.status]
          )}
        >
          {reasoning ? `${t("steps.reasoning")} · ${reasoningExcerpt}` : resolveStepLabel(step, t)}
          {chain ? <AgentChainBadges node={chain} t={t} /> : null}
          {step.sourceCount ? (
            <span className="ml-1.5 text-[10px] text-muted-foreground">
              {t("steps.sources", { count: step.sourceCount })}
            </span>
          ) : null}
        </span>
        {duration && !reasoning && (
          <span className="mt-0.5 shrink-0 font-mono text-[10px] tabular-nums text-muted-foreground/80">
            {duration}
          </span>
        )}
      </div>

      <AnimatePresence initial={false}>
        {expanded && collapsible && (
          <motion.div
            key="body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div className="pl-[1.375rem]">
              {chain && <AgentChainNode node={chain} t={t} />}
              {detail && (
                <p
                  className={cn(
                    "whitespace-pre-wrap break-words py-1 text-[11px] leading-4 text-muted-foreground",
                    // 思考内容通常很长，限高并可滚动，避免把轨迹撑爆
                    reasoning &&
                      "max-h-64 overflow-y-auto rounded-md border border-dashed bg-muted/20 px-2 py-1.5 font-mono"
                  )}
                >
                  {detail}
                </p>
              )}
              {childSteps.length > 0 && (
                <ul className="space-y-0.5">
                  {childSteps.map((child) => (
                    <AgentStepItem
                      key={child.id}
                      step={child}
                      getChildren={getChildren}
                      isExpanded={isExpanded}
                      onToggle={onToggle}
                      now={now}
                      t={t}
                      depth={depth + 1}
                    />
                  ))}
                </ul>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </li>
  );
};

export const AgentStepItem = memo(AgentStepItemBase);
