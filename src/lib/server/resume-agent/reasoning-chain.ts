import type {
  ReasoningBlocker,
  ReasoningNode,
  ReasoningStage,
  ReasoningToolCall,
  ReasoningVerdict,
  ResumeAgentTraceEvent,
  ResumeAgentTraceStatus,
} from "@/types/resume-agent";

/**
 * 结构化思维链构造器。
 *
 * 取代原先「一句话叙述一件事」的流水账 trace：每个决策都是一个节点，节点必须带
 * 判断依据（basis）、执行动作（action）、预期产出（expectation），收尾时必须给出
 * 校验结论（verdict）。工具调用四要素与卡点声明都挂在节点上，前端据此按节点
 * 渲染展开/折叠，不再依赖自由文本解析。
 *
 * 边界：本模块只负责「把思考过程结构化并发事件」，不做业务判断、不调工具、
 * 不写 checkpoint。业务顺序仍由 runner 决定。
 */

/** 阶段序号与展示名，与五阶段执行链路一致 */
const STAGE_META: Record<ReasoningStage, { index: number; label: string }> = {
  requirement: { index: 1, label: "需求拆解" },
  planning: { index: 2, label: "路径规划" },
  execution: { index: 3, label: "工具执行" },
  validation: { index: 4, label: "结果校验" },
  delivery: { index: 5, label: "最终交付" },
};

/** 校验结论到 trace 状态的默认映射；fail() 会显式覆盖为 error */
const VERDICT_STATUS: Record<ReasoningVerdict, ResumeAgentTraceStatus> = {
  pass: "completed",
  degraded: "warning",
  blocked: "warning",
  skipped: "completed",
  pending: "running",
};

export const reasoningStageLabel = (stage: ReasoningStage) => STAGE_META[stage].label;

type ChainEmitter = (event: Omit<ResumeAgentTraceEvent, "id">) => Promise<unknown>;

export interface ReasoningNodeInit {
  /** 不传则沿用 enter() 设定的当前阶段 */
  stage?: ReasoningStage;
  title: string;
  basis: string;
  action: string;
  expectation?: string;
}

export interface ReasoningNodeHandle {
  readonly node: ReasoningNode;
  /** 工具调度层在调用前后补齐四要素与校验结论 */
  attachTool: (toolCall: ReasoningToolCall) => void;
  pass: (outcome: string) => Promise<void>;
  /** 走了降级方案：产出可用但不完整，必须说明原因与降级逻辑 */
  degrade: (outcome: string, blocker: ReasoningBlocker) => Promise<void>;
  /** 卡点：缺信息或需用户决策，等外部输入 */
  block: (blocker: ReasoningBlocker) => Promise<void>;
  /** 依赖不满足或已完成，主动跳过 */
  skip: (outcome: string) => Promise<void>;
  /** 硬失败：没有可用降级方案 */
  fail: (blocker: ReasoningBlocker) => Promise<void>;
}

/** 纯文本兜底，供不认识 chain 字段的旧渲染路径展示 */
const toDetailText = (node: ReasoningNode) =>
  [
    `判断依据：${node.basis}`,
    `执行动作：${node.action}`,
    node.expectation ? `预期产出：${node.expectation}` : "",
    node.outcome ? `实际产出：${node.outcome}` : "",
    node.toolCall
      ? `工具：${node.toolCall.tool}｜原因：${node.toolCall.reason}｜入参逻辑：${node.toolCall.inputLogic}`
      : "",
    node.blocker ? `卡点：${node.blocker.reason}｜处理方案：${node.blocker.recovery}` : "",
  ]
    .filter(Boolean)
    .join("\n");

export class ReasoningChain {
  private readonly counters = new Map<ReasoningStage, number>();
  private stage: ReasoningStage = "requirement";
  private openNode?: ReasoningNodeHandle;

  constructor(private readonly emit: ChainEmitter) {}

  /** 切换当前阶段；后续 node() 未显式指定 stage 时归入该阶段 */
  enter(stage: ReasoningStage) {
    this.stage = stage;
    return this;
  }

  /** 当前打开的节点，工具调度层用它判断是否要新开节点 */
  get active() {
    return this.openNode;
  }

  async node(init: ReasoningNodeInit): Promise<ReasoningNodeHandle> {
    const stage = init.stage || this.stage;
    const sequence = (this.counters.get(stage) || 0) + 1;
    this.counters.set(stage, sequence);
    const node: ReasoningNode = {
      id: crypto.randomUUID(),
      stage,
      ordinal: `${STAGE_META[stage].index}.${sequence}`,
      title: init.title,
      basis: init.basis,
      action: init.action,
      expectation: init.expectation,
      verdict: "pending",
      status: "running",
      startedAt: new Date().toISOString(),
    };

    const publish = async () => {
      await this.emit({
        stage: "chain",
        title: node.title,
        detail: toDetailText(node),
        status: node.status,
        chain: { ...node },
      });
    };

    const settle = async (
      verdict: ReasoningVerdict,
      patch: Partial<Pick<ReasoningNode, "outcome" | "blocker">>,
      statusOverride?: ResumeAgentTraceStatus
    ) => {
      node.verdict = verdict;
      node.status = statusOverride || VERDICT_STATUS[verdict];
      node.completedAt = new Date().toISOString();
      if (patch.outcome !== undefined) node.outcome = patch.outcome;
      if (patch.blocker !== undefined) node.blocker = patch.blocker;
      if (this.openNode === handle) this.openNode = undefined;
      await publish();
    };

    const handle: ReasoningNodeHandle = {
      node,
      attachTool: (toolCall) => {
        node.toolCall = toolCall;
      },
      pass: (outcome) => settle("pass", { outcome }),
      degrade: (outcome, blocker) => settle("degraded", { outcome, blocker }),
      block: (blocker) => settle("blocked", { outcome: blocker.recovery, blocker }),
      skip: (outcome) => settle("skipped", { outcome }),
      fail: (blocker) => settle("blocked", { outcome: blocker.recovery, blocker }, "error"),
    };

    this.openNode = handle;
    await publish();
    return handle;
  }

  /**
   * 异常路径收尾：Job 失败/取消时把仍打开的节点标成硬失败，
   * 否则前端会留一个永远转圈的节点。
   */
  async settleOpen(blocker: ReasoningBlocker) {
    if (!this.openNode) return;
    await this.openNode.fail(blocker);
  }
}
