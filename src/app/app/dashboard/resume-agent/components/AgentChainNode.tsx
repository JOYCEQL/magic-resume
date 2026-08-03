import { cn } from "@/lib/utils";
import type { Translator } from "@/i18n/compat/utils";
import type { ReasoningNode, ReasoningVerdict } from "@/types/resume-agent";

/**
 * 结构化思维链节点的展开内容。
 *
 * 与自由文本 detail 的区别：这里每个要素都是独立字段，按固定顺序渲染
 * （判断依据 → 执行动作 → 预期/实际产出 → 工具四要素 → 卡点与处理方案），
 * 前端不需要解析文本，也不会因为服务端换个说法就渲染错位。
 */

const VERDICT_CLASS: Record<ReasoningVerdict, string> = {
  pass: "border-emerald-500/40 text-emerald-700 dark:text-emerald-500",
  degraded: "border-amber-500/40 text-amber-700 dark:text-amber-500",
  blocked: "border-amber-500/40 text-amber-700 dark:text-amber-500",
  skipped: "border-border text-muted-foreground",
  pending: "border-primary/40 text-primary",
};

interface FieldProps {
  label: string;
  value?: string;
  /** 问题类字段用警示色，正常字段用次要色 */
  tone?: "default" | "warning";
}

const Field = ({ label, value, tone = "default" }: FieldProps) => {
  if (!value) return null;
  return (
    <div className="flex gap-1.5">
      <span className="shrink-0 text-muted-foreground/70">{label}</span>
      <span
        className={cn(
          "min-w-0 flex-1 whitespace-pre-wrap break-words",
          tone === "warning" ? "text-amber-700 dark:text-amber-500" : "text-muted-foreground"
        )}
      >
        {value}
      </span>
    </div>
  );
};

interface AgentChainNodeProps {
  node: ReasoningNode;
  t: Translator;
}

export const AgentChainNode = ({ node, t }: AgentChainNodeProps) => {
  const tool = node.toolCall;
  return (
    <div className="space-y-1 py-1 text-[11px] leading-4">
      <Field label={t("steps.chain.basis")} value={node.basis} />
      <Field label={t("steps.chain.action")} value={node.action} />
      <Field label={t("steps.chain.expectation")} value={node.expectation} />
      <Field label={t("steps.chain.outcome")} value={node.outcome} />

      {tool && (
        <div className="mt-1 space-y-1 rounded-md border border-dashed bg-muted/20 px-2 py-1.5">
          <div className="font-mono text-[10px] text-foreground/80">
            {tool.tool}
            {tool.attempts && tool.attempts > 1
              ? ` · ${t("steps.chain.attempts", { count: tool.attempts })}`
              : ""}
          </div>
          <Field label={t("steps.chain.toolReason")} value={tool.reason} />
          <Field label={t("steps.chain.toolInput")} value={tool.inputLogic} />
          <Field label={t("steps.chain.toolExpected")} value={tool.expected} />
          <Field
            label={t("steps.chain.inputIssues")}
            value={tool.inputIssues?.join("；")}
            tone="warning"
          />
          <Field
            label={t("steps.chain.outputIssues")}
            value={tool.outputIssues?.join("；")}
            tone="warning"
          />
        </div>
      )}

      {node.blocker && (
        <div className="mt-1 space-y-1 rounded-md border border-amber-500/30 bg-amber-500/[0.07] px-2 py-1.5">
          <Field
            label={t("steps.chain.blockerReason")}
            value={node.blocker.reason}
            tone="warning"
          />
          <Field label={t("steps.chain.blockerRecovery")} value={node.blocker.recovery} />
        </div>
      )}
    </div>
  );
};

/** 折叠态标题右侧的阶段编号与校验结论徽标 */
export const AgentChainBadges = ({ node, t }: AgentChainNodeProps) => (
  <span className="ml-1.5 inline-flex shrink-0 items-center gap-1">
    <span className="rounded border border-border px-1 font-mono text-[10px] text-muted-foreground">
      {node.ordinal}
    </span>
    <span className={cn("rounded border px-1 text-[10px]", VERDICT_CLASS[node.verdict])}>
      {t(`steps.chain.verdict.${node.verdict}`)}
    </span>
  </span>
);
