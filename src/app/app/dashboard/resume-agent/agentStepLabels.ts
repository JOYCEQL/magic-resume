import type { Translator } from "@/i18n/compat/utils";
import type { AgentStepStatus, AgentTimelineStep } from "@/types/resume-agent-ui";

/** 服务端 phase 标识 → i18n 子键；未覆盖时回退服务端下发的 title */
const PHASE_KEYS = new Set([
  "intake",
  "candidate_facts",
  "target_definition",
  "job_discovery",
  "job_research",
  "jd_analysis",
  "career_ops_evaluation",
  "resume_tailoring",
  "fact_gate",
  "user_confirmation",
  "completed",
]);

/** 与 src/lib/server/resume-agent/tool-registry.ts 注册的原生工具一致 */
const TOOL_KEYS = new Set([
  "resume_web_search",
  "resume_discover_job_postings",
  "resume_fetch_job_posting",
  "resume_extract_job_posting",
  "resume_extract_ats_keywords",
  "resume_analyze_skill_gap",
  "resume_rank_evidence",
  "resume_build_recruiter_risk_map",
  "resume_validate_draft_facts",
]);

const MILESTONE_KEYS: Record<string, string> = {
  "milestone:user_required": "userRequired",
  "milestone:job.failed": "jobFailed",
  "milestone:job.cancelled": "jobCancelled",
  "milestone:execution_stop": "executionStop",
};

/** 标题优先本地化，未覆盖的键回退服务端 title */
export const resolveStepLabel = (step: AgentTimelineStep, t: Translator) => {
  if (step.kind === "reasoning") return t("steps.reasoning");
  if (step.kind === "phase" && step.phase && PHASE_KEYS.has(step.phase)) {
    return t(`steps.phase.${step.phase}`);
  }
  if (step.kind === "tool" && step.tool && TOOL_KEYS.has(step.tool)) {
    return t(`steps.tool.${step.tool}`);
  }
  const milestoneKey = MILESTONE_KEYS[step.key];
  if (step.kind === "milestone" && milestoneKey) {
    return t(`steps.milestone.${milestoneKey}`);
  }
  return step.title;
};

/**
 * user.required 的 title 是给用户看的问题原文，本地化标题会盖掉它，
 * 因此把原文降级为 detail 展示。
 */
export const resolveStepDetail = (step: AgentTimelineStep) =>
  step.kind === "milestone" && step.key === "milestone:user_required"
    ? [step.title, step.detail].filter(Boolean).join("\n")
    : step.detail;

export const formatDuration = (durationMs?: number) => {
  if (durationMs === undefined || durationMs < 0) return "";
  if (durationMs < 1000) return `${durationMs}ms`;
  const seconds = durationMs / 1000;
  if (seconds < 60) return `${seconds.toFixed(seconds < 10 ? 1 : 0)}s`;
  const totalMinutes = Math.floor(seconds / 60);
  if (totalMinutes < 60) {
    return `${totalMinutes}m${String(Math.round(seconds % 60)).padStart(2, "0")}s`;
  }
  // 恢复跨会话的未结算步骤会算出很大的跨度；超过 1 小时要有小时进位，
  // 否则显示成「1231m04s」这种读不懂的字符串。
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}h${String(minutes).padStart(2, "0")}m${String(Math.round(seconds % 60)).padStart(2, "0")}s`;
};

export const STEP_STATUS_TEXT_CLASS: Record<AgentStepStatus, string> = {
  pending: "text-muted-foreground",
  running: "text-foreground",
  completed: "text-foreground",
  warning: "text-amber-600 dark:text-amber-500",
  error: "text-destructive",
  cancelled: "text-muted-foreground",
};

/** 思考内容用等宽小字，与可验证步骤在视觉上区分开 */
export const isReasoningStep = (step: AgentTimelineStep) => step.kind === "reasoning";

export const isStepOpenEnded = (status: AgentStepStatus) =>
  status === "running" || status === "pending";
