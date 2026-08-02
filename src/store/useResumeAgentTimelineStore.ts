import { create } from "zustand";
import type {
  ResumeAgentJobEvent,
  ResumeAgentToolInvocation,
  ResumeAgentTraceEvent,
  ResumeAgentWorkflowPhase,
} from "@/types/resume-agent";
import type {
  AgentStepStatus,
  AgentTimelineStats,
  AgentTimelineStep,
} from "@/types/resume-agent-ui";

const MAX_STEPS = 200;

/** 与工作流无关的噪音事件不进入时间线 */
const IGNORED_EVENT_TYPES = new Set<ResumeAgentJobEvent["type"]>([
  "job.created",
  "checkpoint.saved",
]);

const RUNTIME_STAGES = new Set(["native-runtime", "runtime", "fallback"]);
/** 非工具类 trace stage：直接作为顶层里程碑，不去找同名工具步骤 */
const STANDALONE_STAGES = new Set([
  "research-loop",
  "model-output",
  "continue-runtime",
  "intake",
]);
const TERMINAL_STATUSES = new Set<AgentStepStatus>([
  "completed",
  "warning",
  "error",
  "cancelled",
]);

const parseTime = (value?: string) => {
  if (!value) return Date.now();
  const time = new Date(value).getTime();
  return Number.isFinite(time) ? time : Date.now();
};

const nextId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `step-${Math.random().toString(36).slice(2)}-${Date.now()}`;

interface TimelineSlice {
  steps: AgentTimelineStep[];
  activePhaseId?: string;
}

interface ResumeAgentTimelineState extends TimelineSlice {
  /** 用户手动 toggle 的覆盖值；未命中时走默认展开规则 */
  expandedOverrides: Record<string, boolean>;
  ingestEvent: (event: ResumeAgentJobEvent) => void;
  ingestEvents: (events: ResumeAgentJobEvent[]) => void;
  /** 终止所有 running 步骤，并追加一条终止里程碑 */
  settleRunning: (
    status: Extract<AgentStepStatus, "error" | "cancelled">,
    title: string,
    detail: string
  ) => void;
  toggleStep: (id: string) => void;
  setStepExpanded: (id: string, expanded: boolean) => void;
  collapseAll: () => void;
  expandAll: () => void;
  reset: () => void;
  /** 从持久化的会话快照恢复 */
  hydrate: (steps: AgentTimelineStep[]) => void;
}

const cloneSteps = (steps: AgentTimelineStep[]) =>
  steps.map((step) => ({ ...step, childIds: [...(step.childIds || [])] }));

const closeStep = (
  step: AgentTimelineStep,
  status: AgentStepStatus,
  timestamp: number,
  detail?: string
): AgentTimelineStep => {
  const endedAt = step.endedAt ?? timestamp;
  return {
    ...step,
    status,
    detail: detail ?? step.detail,
    endedAt,
    durationMs: step.durationMs ?? Math.max(0, endedAt - step.startedAt),
  };
};

/** 结算某个阶段下仍未结束的子步骤；阶段状态继承最坏子状态 */
const settlePhase = (
  steps: AgentTimelineStep[],
  phaseId: string,
  timestamp: number
): AgentTimelineStep[] => {
  const phase = steps.find((step) => step.id === phaseId);
  if (!phase || TERMINAL_STATUSES.has(phase.status)) return steps;
  const hasError = steps.some((step) => step.parentId === phaseId && step.status === "error");
  const settled = steps.map((step) =>
    step.parentId === phaseId && (step.status === "running" || step.status === "pending")
      ? closeStep(step, "completed", timestamp)
      : step
  );
  return settled.map((step) =>
    step.id === phaseId ? closeStep(step, hasError ? "error" : "completed", timestamp) : step
  );
};

const findOpenToolStep = (steps: AgentTimelineStep[], tool: string) =>
  [...steps]
    .reverse()
    .find((step) => step.kind === "tool" && step.tool === tool && step.status === "running");

const applyEvent = (state: TimelineSlice, event: ResumeAgentJobEvent): TimelineSlice => {
  if (IGNORED_EVENT_TYPES.has(event.type)) return state;

  const sequence = event.sequence;
  const timestamp = parseTime(event.createdAt);
  let steps = state.steps;
  let activePhaseId = state.activePhaseId;

  const pushStep = (step: AgentTimelineStep) => {
    steps = [...steps, step];
    if (!step.parentId) return;
    steps = steps.map((item) =>
      item.id === step.parentId && !item.childIds.includes(step.id)
        ? { ...item, childIds: [...item.childIds, step.id] }
        : item
    );
  };

  switch (event.type) {
    case "phase.changed": {
      const phase = event.payload.phase as ResumeAgentWorkflowPhase | undefined;
      if (!phase) break;
      if (activePhaseId) steps = settlePhase(steps, activePhaseId, timestamp);
      const existing = steps.find((step) => step.kind === "phase" && step.key === `phase:${phase}`);
      if (existing) {
        // 恢复/作答会重进同一阶段：重新打开而不是新建一条。
        // startedAt 必须一起重置，否则耗时从「上一轮首次进入」算起——
        // 实测一次 71s 的重跑被显示成 8m28s。
        steps = steps.map((step) =>
          step.id === existing.id
            ? {
                ...step,
                status: "running",
                startedAt: timestamp,
                endedAt: undefined,
                durationMs: undefined,
                sequence,
              }
            : step
        );
        activePhaseId = existing.id;
        break;
      }
      const id = nextId();
      pushStep({
        id,
        kind: "phase",
        key: `phase:${phase}`,
        title: phase,
        status: "running",
        phase,
        startedAt: timestamp,
        sequence,
        childIds: [],
      });
      activePhaseId = id;
      break;
    }

    case "tool.started": {
      const tool = event.payload.tool as string | undefined;
      if (!tool) break;
      pushStep({
        id: nextId(),
        parentId: activePhaseId,
        kind: "tool",
        key: `tool:${tool}`,
        title: tool,
        status: "running",
        tool,
        phase: event.payload.phase as ResumeAgentWorkflowPhase | undefined,
        startedAt: timestamp,
        sequence,
        childIds: [],
      });
      break;
    }

    case "tool.completed": {
      const invocation = event.payload.invocation as ResumeAgentToolInvocation | undefined;
      if (!invocation) break;
      const status: AgentStepStatus = invocation.status === "error" ? "error" : "completed";
      const startedAt = parseTime(invocation.startedAt);
      const endedAt = parseTime(invocation.completedAt || invocation.startedAt);
      const open = findOpenToolStep(steps, invocation.tool);
      if (open) {
        // 服务端 invocation 时间戳比事件到达时间更准确
        steps = steps.map((step) =>
          step.id === open.id
            ? {
                ...step,
                status,
                detail: invocation.outputSummary || step.detail,
                startedAt,
                endedAt,
                durationMs: Math.max(0, endedAt - startedAt),
                sequence,
              }
            : step
        );
        break;
      }
      pushStep({
        id: nextId(),
        parentId: activePhaseId,
        kind: "tool",
        key: `tool:${invocation.tool}`,
        title: invocation.tool,
        detail: invocation.outputSummary,
        status,
        tool: invocation.tool,
        phase: invocation.phase,
        startedAt,
        endedAt,
        durationMs: Math.max(0, endedAt - startedAt),
        sequence,
        childIds: [],
      });
      break;
    }

    case "tool.failed": {
      const tool = event.payload.tool as string | undefined;
      const detail = event.payload.error as string | undefined;
      if (!tool) break;
      const open = findOpenToolStep(steps, tool);
      if (open) {
        steps = steps.map((step) =>
          step.id === open.id ? closeStep(step, "error", timestamp, detail) : step
        );
        break;
      }
      pushStep({
        id: nextId(),
        parentId: activePhaseId,
        kind: "tool",
        key: `tool:${tool}`,
        title: tool,
        detail,
        status: "error",
        tool,
        startedAt: timestamp,
        endedAt: timestamp,
        durationMs: 0,
        sequence,
        childIds: [],
      });
      break;
    }

    case "trace.updated": {
      const trace = event.payload.trace as ResumeAgentTraceEvent | undefined;
      if (!trace) break;
      if (RUNTIME_STAGES.has(trace.stage)) {
        if (steps.some((step) => step.kind === "runtime" && step.key === `runtime:${trace.stage}`)) break;
        pushStep({
          id: nextId(),
          kind: "runtime",
          key: `runtime:${trace.stage}`,
          title: trace.title,
          detail: trace.detail,
          status: trace.status,
          startedAt: timestamp,
          endedAt: timestamp,
          durationMs: 0,
          sequence,
          childIds: [],
        });
        break;
      }
      if (STANDALONE_STAGES.has(trace.stage)) {
        const existing = steps.find(
          (step) => step.kind === "milestone" && step.key === `stage:${trace.stage}`
        );
        if (existing) {
          // research-loop 会先发 running 再发 completed，合并成同一条
          steps = steps.map((step) =>
            step.id === existing.id
              ? {
                  ...step,
                  title: trace.title,
                  detail: trace.detail ?? step.detail,
                  status: trace.status,
                  sourceCount: trace.sourceCount ?? step.sourceCount,
                  endedAt: timestamp,
                  durationMs: Math.max(0, timestamp - step.startedAt),
                  sequence,
                }
              : step
          );
          break;
        }
        pushStep({
          id: nextId(),
          kind: "milestone",
          key: `stage:${trace.stage}`,
          title: trace.title,
          detail: trace.detail,
          status: trace.status,
          sourceCount: trace.sourceCount,
          startedAt: timestamp,
          sequence,
          childIds: [],
        });
        break;
      }
      // 工具类 trace 只补齐服务端下发的可读标题与摘要；步骤本身由 tool.* 事件驱动
      const open = findOpenToolStep(steps, trace.stage);
      if (open) {
        steps = steps.map((step) =>
          step.id === open.id
            ? {
                ...step,
                title: step.title === step.tool ? trace.title : step.title,
                detail: trace.detail ?? step.detail,
                sourceCount: trace.sourceCount ?? step.sourceCount,
              }
            : step
        );
      }
      break;
    }

    case "model.reasoning": {
      const reasoning = event.payload.reasoning as string | undefined;
      if (!reasoning) break;
      // 思考挂在当前阶段下，与工具调用同级；每次调用一条，不做合并
      pushStep({
        id: nextId(),
        parentId: activePhaseId,
        kind: "reasoning",
        key: `reasoning:${sequence}`,
        title: (event.payload.model as string | undefined) || "model",
        detail: reasoning,
        status: "completed",
        phase: event.payload.phase as ResumeAgentWorkflowPhase | undefined,
        startedAt: timestamp,
        endedAt: timestamp,
        durationMs: 0,
        sequence,
        childIds: [],
      });
      break;
    }

    case "user.required": {
      if (activePhaseId) {
        steps = settlePhase(steps, activePhaseId, timestamp);
        activePhaseId = undefined;
      }
      const question = event.payload.question as string | undefined;
      const factIssues = (event.payload.factIssues as string[] | undefined) || [];
      pushStep({
        id: nextId(),
        kind: "milestone",
        key: "milestone:user_required",
        title: question || "waiting_user",
        detail: factIssues.length ? factIssues.join("；") : undefined,
        status: factIssues.length ? "warning" : "completed",
        startedAt: timestamp,
        endedAt: timestamp,
        durationMs: 0,
        sequence,
        childIds: [],
      });
      break;
    }

    case "job.failed":
    case "job.cancelled": {
      const status: AgentStepStatus = event.type === "job.cancelled" ? "cancelled" : "error";
      if (activePhaseId) {
        const phaseId = activePhaseId;
        steps = steps.map((step) =>
          (step.parentId === phaseId || step.id === phaseId) && step.status === "running"
            ? closeStep(step, status, timestamp)
            : step
        );
        activePhaseId = undefined;
      }
      pushStep({
        id: nextId(),
        kind: "milestone",
        key: `milestone:${event.type}`,
        title: (event.payload.error as string | undefined) || event.type,
        status,
        startedAt: timestamp,
        endedAt: timestamp,
        durationMs: 0,
        sequence,
        childIds: [],
      });
      break;
    }

    default:
      break;
  }

  return {
    steps: steps.length > MAX_STEPS ? steps.slice(-MAX_STEPS) : steps,
    activePhaseId,
  };
};

export const useResumeAgentTimelineStore = create<ResumeAgentTimelineState>()((set, get) => ({
  steps: [],
  expandedOverrides: {},
  activePhaseId: undefined,
  ingestEvent: (event) =>
    set((state) => applyEvent({ steps: state.steps, activePhaseId: state.activePhaseId }, event)),
  ingestEvents: (events) =>
    set((state) =>
      events.reduce(applyEvent, { steps: state.steps, activePhaseId: state.activePhaseId })
    ),
  settleRunning: (status, title, detail) =>
    set((state) => {
      const timestamp = Date.now();
      const sequence = (state.steps.at(-1)?.sequence || 0) + 1;
      const steps = state.steps.map((step) =>
        step.status === "running" || step.status === "pending"
          ? closeStep(step, status, timestamp)
          : step
      );
      return {
        steps: [
          ...steps.filter((step) => step.key !== "milestone:execution_stop"),
          {
            id: nextId(),
            kind: "milestone" as const,
            key: "milestone:execution_stop",
            title,
            detail,
            status,
            startedAt: timestamp,
            endedAt: timestamp,
            durationMs: 0,
            sequence,
            childIds: [],
          },
        ],
        activePhaseId: undefined,
      };
    }),
  toggleStep: (id) =>
    set((state) => ({
      expandedOverrides: { ...state.expandedOverrides, [id]: !isStepExpanded(get(), id) },
    })),
  setStepExpanded: (id, expanded) =>
    set((state) => ({ expandedOverrides: { ...state.expandedOverrides, [id]: expanded } })),
  collapseAll: () =>
    set((state) => ({
      expandedOverrides: Object.fromEntries(state.steps.map((step) => [step.id, false])),
    })),
  expandAll: () =>
    set((state) => ({
      expandedOverrides: Object.fromEntries(state.steps.map((step) => [step.id, true])),
    })),
  reset: () => set({ steps: [], expandedOverrides: {}, activePhaseId: undefined }),
  hydrate: (steps) =>
    set({
      // 会话恢复时若上次运行未结束，running/pending 步骤没有对应的完成事件，
      // 会永远转圈并显示跨会话的荒谬耗时。统一归一为 cancelled 并冻结耗时。
      steps: cloneSteps(steps)
        .map((step) => {
          if (step.status !== "running" && step.status !== "pending") return step;
          const endedAt = step.endedAt ?? step.startedAt;
          return {
            ...step,
            status: "cancelled" as const,
            endedAt,
            durationMs: step.durationMs ?? Math.max(0, endedAt - step.startedAt),
          };
        })
        .slice(-MAX_STEPS),
      expandedOverrides: {},
      activePhaseId: undefined,
    }),
}));

/**
 * 默认展开规则（无用户覆盖时）：
 * - reasoning 始终折叠：内容长，展开会把轨迹淹没
 * - running / pending 展开：最新步骤始终可见
 * - error / warning 展开：问题不会被折叠隐藏
 * - 其余已完成步骤折叠，但保留最后一条顶层步骤展开
 */
export const isStepExpanded = (
  state: Pick<ResumeAgentTimelineState, "steps" | "expandedOverrides">,
  id: string
) => {
  const override = state.expandedOverrides[id];
  if (typeof override === "boolean") return override;
  const step = state.steps.find((item) => item.id === id);
  if (!step) return false;
  if (step.kind === "reasoning") return false;
  if (step.status === "running" || step.status === "pending") return true;
  if (step.status === "error" || step.status === "warning") return true;
  return [...state.steps].reverse().find((item) => !item.parentId)?.id === id;
};

/**
 * 纯函数派生，配合组件内 useMemo 使用。
 * 不要写成 zustand selector：每次调用都会返回新数组，会让组件在任何 store 变更时都重渲染。
 */
export const groupSteps = (steps: AgentTimelineStep[]) => {
  const childrenByParent = new Map<string, AgentTimelineStep[]>();
  for (const step of steps) {
    if (!step.parentId) continue;
    const bucket = childrenByParent.get(step.parentId);
    if (bucket) bucket.push(step);
    else childrenByParent.set(step.parentId, [step]);
  }
  return {
    topLevel: steps.filter((step) => !step.parentId),
    childrenByParent,
  };
};

export const computeTimelineStats = (steps: AgentTimelineStep[]): AgentTimelineStats => {
  if (!steps.length) return { total: 0, running: 0, failed: 0, durationMs: 0 };
  const start = Math.min(...steps.map((step) => step.startedAt));
  const end = Math.max(...steps.map((step) => step.endedAt ?? step.startedAt));
  return {
    total: steps.length,
    running: steps.filter((step) => step.status === "running").length,
    failed: steps.filter((step) => step.status === "error").length,
    durationMs: Math.max(0, end - start),
  };
};
