import type {
  ReasoningNode,
  ResumeAgentTraceStatus,
  ResumeAgentWorkflowPhase,
} from "@/types/resume-agent";

/** 执行步骤状态直接复用服务端轨迹状态，避免出现两套语义。 */
export type AgentStepStatus = ResumeAgentTraceStatus;

/**
 * runtime：运行时里程碑（原生 Agent / OpenCode / 兼容模式）
 * phase：工作流阶段，作为父级容器
 * tool：阶段内的具体工具调用（子步骤）
 * reasoning：模型思考过程，仅在用户显式开启后才会出现
 * milestone：等待用户、任务终止等单点事件
 * chain：结构化思维链决策节点（判断依据 / 执行动作 / 产出 / 校验结论）
 */
export type AgentStepKind =
  | "runtime"
  | "phase"
  | "tool"
  | "reasoning"
  | "milestone"
  | "chain";

export interface AgentTimelineStep {
  id: string;
  /** 父步骤 id；顶层步骤为 undefined */
  parentId?: string;
  kind: AgentStepKind;
  /** 去重键：把同一步的 running / completed 两次事件合并，而不是追加成两条 */
  key: string;
  /** 服务端下发的原始标题，本地化缺失时作为兜底 */
  title: string;
  detail?: string;
  status: AgentStepStatus;
  tool?: string;
  phase?: ResumeAgentWorkflowPhase;
  sourceCount?: number;
  /** kind==="chain" 时的结构化节点内容，供按节点渲染 */
  chain?: ReasoningNode;
  /** epoch ms，取自 Job 事件的 createdAt */
  startedAt: number;
  endedAt?: number;
  /** 结束时冻结耗时，避免后续重渲染跳动 */
  durationMs?: number;
  /** 来源 Job 事件序号，用于稳定排序与判定“最新步骤” */
  sequence: number;
  childIds: string[];
}

export type AgentRunState =
  | "idle"
  | "running"
  // Job 停在 user.required，正在等用户补充信息（不是完成）
  | "waiting_user"
  | "completed"
  | "error"
  | "timeout"
  | "cancelled";

/**
 * draft   结构化简历草稿（含快捷工具）
 * preview A4 实时预览画布
 * trace   完整执行轨迹
 * 澄清问题卡片已移入对话流，「待办与缺口」Tab 移除。
 */
export type AgentSidePanelTab = "draft" | "preview" | "trace";

export interface AgentTimelineStats {
  total: number;
  running: number;
  failed: number;
  /** 首个步骤开始到最后一个步骤结束的跨度 */
  durationMs: number;
}
