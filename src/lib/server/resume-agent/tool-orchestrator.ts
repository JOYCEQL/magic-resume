import type {
  CareerOpsEvaluation,
  JobResearchBundle,
  ResearchSource,
  ResumeAgentToolInvocation,
  ResumeAgentWorkflowPhase,
  ResumeDraft,
} from "@/types/resume-agent";
import type { ReasoningChain } from "./reasoning-chain";
import { executeNativeTool } from "./tool-registry";
import type { WebSearchOutcome } from "./web-search";

/**
 * 工具调度层：把分散的工具调用收敛成统一的
 * 「规划 → 入参校验 → 执行（重试 / 降级）→ 产出校验 → 参数回填」闭环。
 *
 * 与 tool-registry 的分工：registry 只回答「怎么执行一个工具」，本模块回答
 * 「什么时候调、按什么顺序调、参数从哪来、失败了怎么办」。新增工具只需在下方
 * 补一条 ToolSpec，闭环、校验、重试、降级与思维链记录自动生效。
 */

/** 工具执行中的标题；完成时把「正在」替换为「已完成」 */
export const TOOL_TITLES: Record<string, string> = {
  resume_web_search: "正在检索公开招聘线索",
  resume_discover_job_postings: "正在搜索目标公司的公开招聘源",
  resume_fetch_job_posting: "正在读取并验证岗位页面",
  resume_extract_job_posting: "正在提取岗位职责与要求",
  resume_extract_ats_keywords: "正在提取 ATS 关键词",
  resume_analyze_skill_gap: "正在分析岗位能力缺口",
  resume_rank_evidence: "正在匹配候选人证据",
  resume_build_recruiter_risk_map: "正在进行招聘者视角检查",
  resume_validate_draft_facts: "正在执行事实门禁",
};

export const toolTitle = (tool: string) => TOOL_TITLES[tool] || `正在执行 ${tool}`;

export type PostingLiveness = "active" | "expired" | "uncertain";

export interface FetchedPosting {
  source: ResearchSource;
  text: string;
  status: PostingLiveness;
}

/**
 * 工具间共享的参数袋。上一个工具的输出由 spec.collect 写入，下一个工具的
 * spec.adapt 从这里取参，实现参数自动传递，而不是调用方手工搬运中间结果。
 */
export interface ToolResultBag {
  company: string;
  targetRole: string;
  /** 用户提供或抓取到的岗位正文 */
  jobDescription: string;
  /** 待抓取的岗位 URL 队列，来源为用户输入或搜索结果 */
  pendingUrls: string[];
  /** 最近一次成功抓取（或用户直接提供）的岗位页面 */
  fetched?: FetchedPosting;
  sources: ResearchSource[];
  keywords: string[];
  draft?: ResumeDraft;
  research?: JobResearchBundle;
  evaluation?: CareerOpsEvaluation;
}

/** 单条工具的调度声明。新增工具只加一条，不改调度代码 */
export interface ToolSpec<Input, Output> {
  tool: string;
  /** 声明该工具在哪个工作流阶段执行；必须落在 tool-registry 注册的 phases 内 */
  phase: ResumeAgentWorkflowPhase;
  /** 调用原因：写进思维链节点，说明为什么这一步必须用它 */
  reason: string;
  /** 预期返回结果：写进思维链节点，供结果校验对照 */
  expected: string;
  /** 从参数袋构造入参；返回 null 表示依赖不满足，调度层跳过该步 */
  adapt: (bag: ToolResultBag) => Input | null;
  /** 入参构造逻辑的自然语言说明，写进思维链 */
  inputLogic: (input: Input) => string;
  /** 入参合法性校验；返回问题列表，非空则不执行 */
  validateInput?: (input: Input) => string[];
  /** 结果可用性校验；返回问题列表，非空视为「执行成功但结果不可用」 */
  validateOutput?: (output: Output) => string[];
  /** 把输出回填进参数袋，供后续工具取用 */
  collect?: (bag: ToolResultBag, output: Output) => void;
  /**
   * 降级方案。结果不可用或重试仍失败时调用；返回 null 表示无降级方案。
   * 返回的字符串是降级逻辑说明，写进思维链的 recovery。
   */
  degrade?: (bag: ToolResultBag, error?: unknown) => string | null;
}

export interface OrchestratorHooks {
  jobId: string;
  signal: AbortSignal;
  chain: ReasoningChain;
  /** 工具开始执行（用于 tool.started 事件与旧 trace） */
  onToolStart: (tool: string, phase: ResumeAgentWorkflowPhase) => Promise<void>;
  /** 工具结束（成功或失败），invocation 可能为空（入参校验未过时不产生调用） */
  onToolSettled: (
    tool: string,
    invocation: ResumeAgentToolInvocation | undefined,
    error?: unknown
  ) => Promise<void>;
}

export type StepOutcome =
  | { state: "completed"; output: unknown }
  | { state: "skipped"; reason: string }
  /** 工具执行了但结果不可用，或入参校验未过；output 在前者存在，供调用方保留说明 */
  | { state: "degraded"; reason: string; output?: unknown }
  | { state: "failed"; error: unknown };

const errorMessage = (error: unknown) =>
  error instanceof Error ? error.message : String(error);

/** 瞬时错误才值得重试；SSRF 拦截、参数非法这类确定性失败重试没有意义 */
const isRetriable = (error: unknown) =>
  /(fetch failed|network|ECONNRESET|ECONNREFUSED|ETIMEDOUT|EAI_AGAIN|socket hang up|other side closed|terminated|429|rate.?limit|502|503|504|timeout)/i.test(
    errorMessage(error)
  );

/**
 * 执行一个已声明的工具步骤，完成完整闭环。
 *
 * 闭环顺序：adapt（取参）→ validateInput（入参校验）→ execute（失败重试 1 次）
 * → validateOutput（产出校验）→ collect（回填参数袋）。任一环节不通过都会在
 * 思维链上留下带原因与处理方案的节点，不会静默跳过。
 */
export const runToolStep = async <Input, Output>(
  spec: ToolSpec<Input, Output>,
  bag: ToolResultBag,
  hooks: OrchestratorHooks
): Promise<StepOutcome> => {
  const node = await hooks.chain.node({
    stage: "execution",
    title: toolTitle(spec.tool).replace(/^正在/, ""),
    basis: spec.reason,
    action: `调用 ${spec.tool}（阶段 ${spec.phase}）`,
    expectation: spec.expected,
  });

  const input = spec.adapt(bag);
  if (input === null) {
    const reason = "参数袋中缺少该工具的必需依赖";
    await node.skip(`${reason}，本步跳过，不影响后续可执行步骤`);
    return { state: "skipped", reason };
  }

  node.attachTool({
    tool: spec.tool,
    reason: spec.reason,
    inputLogic: spec.inputLogic(input),
    expected: spec.expected,
  });

  const inputIssues = spec.validateInput?.(input) || [];
  if (inputIssues.length) {
    node.attachTool({
      tool: spec.tool,
      reason: spec.reason,
      inputLogic: spec.inputLogic(input),
      expected: spec.expected,
      inputIssues,
    });
    const recovery = spec.degrade?.(bag) || "跳过本步，保留已有证据继续后续流程";
    await node.degrade(`入参校验未通过：${inputIssues.join("；")}`, {
      kind: "missing_info",
      reason: `入参不合法：${inputIssues.join("；")}`,
      recovery,
    });
    return { state: "degraded", reason: recovery };
  }

  // 单次失败自动重试 1 次（仅瞬时错误）；重试仍失败走降级
  let attempts = 0;
  let lastError: unknown;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    if (hooks.signal.aborted) break;
    attempts = attempt + 1;
    await hooks.onToolStart(spec.tool, spec.phase);
    try {
      const executed = await executeNativeTool<Input, Output>(spec.tool, input, {
        jobId: hooks.jobId,
        phase: spec.phase,
        signal: hooks.signal,
      });
      await hooks.onToolSettled(spec.tool, executed.invocation);

      const outputIssues = spec.validateOutput?.(executed.output) || [];
      node.attachTool({
        tool: spec.tool,
        reason: spec.reason,
        inputLogic: spec.inputLogic(input),
        expected: spec.expected,
        outputIssues: outputIssues.length ? outputIssues : undefined,
        attempts,
      });
      if (outputIssues.length) {
        const recovery = spec.degrade?.(bag) || "保留已有证据，跳过依赖该结果的后续步骤";
        await node.degrade(
          `${executed.invocation.outputSummary || "已返回结果"}；但结果不可用：${outputIssues.join("；")}`,
          {
            kind: "tool_failure",
            reason: `结果校验未通过：${outputIssues.join("；")}`,
            recovery,
          }
        );
        return { state: "degraded", reason: recovery, output: executed.output };
      }

      spec.collect?.(bag, executed.output);
      await node.pass(
        `${executed.invocation.outputSummary || "执行完成"}${attempts > 1 ? `（重试 ${attempts - 1} 次后成功）` : ""}`
      );
      return { state: "completed", output: executed.output };
    } catch (error) {
      lastError = error;
      const invocation = (error as Error & { invocation?: ResumeAgentToolInvocation }).invocation;
      await hooks.onToolSettled(spec.tool, invocation, error);
      if (hooks.signal.aborted) break;
      // 确定性失败不重试：重试只会重复同一个错误并烧预算
      if (attempt === 0 && isRetriable(error)) continue;
      break;
    }
  }

  // 取消/预算耗尽不能走降级：那会让已停止的任务继续往后跑
  if (hooks.signal.aborted) {
    await node.fail({
      kind: "budget",
      reason: lastError ? errorMessage(lastError) : "任务已被取消或超出预算",
      recovery: "立即停止本轮执行，检查点保留以便恢复",
    });
    return { state: "failed", error: lastError || new Error("任务已停止") };
  }

  node.attachTool({
    tool: spec.tool,
    reason: spec.reason,
    inputLogic: spec.inputLogic(input),
    expected: spec.expected,
    attempts,
    degraded: true,
  });
  const recovery = spec.degrade?.(bag, lastError);
  if (recovery) {
    await node.degrade(`工具执行失败：${errorMessage(lastError)}`, {
      kind: "tool_failure",
      reason: `${spec.tool} 重试后仍失败：${errorMessage(lastError)}`,
      recovery,
    });
    return { state: "degraded", reason: recovery };
  }
  await node.fail({
    kind: "tool_failure",
    reason: `${spec.tool} 重试后仍失败：${errorMessage(lastError)}`,
    recovery: "无可用降级方案，中止本步并向上抛出",
  });
  return { state: "failed", error: lastError };
};

/* ────────────────────────────────────────────────────────────────────────────
 * 工具声明表。每条声明就是一个完整的调度契约；调度代码不需要为新工具改动。
 * ──────────────────────────────────────────────────────────────────────────── */

/** 读取单个岗位页面。URL 由参数袋队列提供，可用性由 status/text 判定 */
export const FETCH_POSTING_SPEC: ToolSpec<{ url: string }, FetchedPosting> = {
  tool: "resume_fetch_job_posting",
  phase: "job_discovery",
  reason: "岗位要求必须来自真实可核验页面，不能凭模型记忆推断",
  expected: "返回岗位正文与存活状态（active / expired / uncertain）",
  adapt: (bag) => (bag.pendingUrls.length ? { url: bag.pendingUrls[0] } : null),
  inputLogic: (input) => `取自参数袋 pendingUrls 队首：${input.url}`,
  validateInput: (input) =>
    /^https:\/\//i.test(input.url) ? [] : ["仅接受绝对 https:// URL（SSRF 入口约束）"],
  validateOutput: (output) =>
    !output.text.trim()
      ? ["页面正文为空，无法作为岗位证据"]
      : output.status === "uncertain"
        ? ["页面存活状态不确定，不作为岗位证据"]
        : [],
  collect: (bag, output) => {
    bag.pendingUrls = bag.pendingUrls.slice(1);
    bag.fetched = output;
    bag.jobDescription = output.text;
    bag.sources.push(output.source);
  },
  // 单个来源不可用不该拖垮整轮调研：丢弃队首继续下一个 URL
  degrade: (bag) => {
    bag.pendingUrls = bag.pendingUrls.slice(1);
    return bag.pendingUrls.length
      ? "丢弃该来源，继续抓取队列中的下一个岗位链接"
      : "已无其它候选链接，转用用户提供的岗位描述或 ATS 结果";
  },
};

/** 把岗位正文抽成结构化研究包。正文来自上一步抓取或用户粘贴 */
export const EXTRACT_POSTING_SPEC: ToolSpec<
  {
    description: string;
    company: string;
    title: string;
    source: ResearchSource;
    status: PostingLiveness;
  },
  JobResearchBundle
> = {
  tool: "resume_extract_job_posting",
  phase: "job_research",
  reason: "把岗位正文转成可比对的职责与关键词，供匹配度评估使用",
  expected: "返回含 postings / requiredKeywords 的研究包",
  adapt: (bag) => {
    const description = bag.jobDescription.trim();
    if (!description || !bag.fetched) return null;
    return {
      description,
      company: bag.company,
      title: bag.targetRole,
      source: bag.fetched.source,
      status: bag.fetched.status,
    };
  },
  inputLogic: (input) =>
    `正文取自上一步抓取结果（${input.description.length} 字），公司与职位取自草稿 targetJob`,
  validateInput: (input) =>
    input.description.length < 40 ? ["岗位正文过短，不足以提取有效要求"] : [],
  validateOutput: (output) =>
    output.postings.length ? [] : ["未产出任何岗位条目"],
  collect: (bag, output) => {
    bag.sources.push(...output.sources.filter((source) => !bag.sources.includes(source)));
    bag.keywords = [...new Set([...bag.keywords, ...output.requiredKeywords])];
  },
  degrade: () => "跳过该来源的结构化抽取，保留其余来源的证据",
};

/** 查公共 ATS。没有公司名时依赖不满足，调度层会跳过 */
export const DISCOVER_POSTINGS_SPEC: ToolSpec<
  { company: string; targetRole: string },
  JobResearchBundle
> = {
  tool: "resume_discover_job_postings",
  phase: "job_discovery",
  reason: "公共 ATS 是活岗数据，优先级高于通用搜索",
  expected: "返回该公司在 ATS 上的去重在招岗位",
  adapt: (bag) =>
    bag.company.trim() && bag.targetRole.trim()
      ? { company: bag.company.trim(), targetRole: bag.targetRole.trim() }
      : null,
  inputLogic: (input) => `公司与职位取自草稿 targetJob：${input.company} · ${input.targetRole}`,
  validateOutput: (output) => (output.postings.length ? [] : ["ATS 未返回匹配岗位"]),
  collect: (bag, output) => {
    bag.sources.push(...output.sources);
    bag.keywords = [...new Set([...bag.keywords, ...output.requiredKeywords])];
  },
  degrade: () => "转用通用 Web 搜索兜底，把线索页读成岗位证据",
};

/** 通用搜索兜底。产出的 URL 进入抓取队列，实现参数自动传递 */
export const WEB_SEARCH_SPEC: ToolSpec<
  { company?: string; targetRole: string; freshness: "recent" | "any" },
  WebSearchOutcome
> = {
  tool: "resume_web_search",
  phase: "job_discovery",
  reason: "ATS 未覆盖时需要从公司官网招聘页补齐岗位线索",
  expected: "返回候选 URL 与摘要；未配置搜索服务时如实返回 configured=false",
  adapt: (bag) =>
    bag.targetRole.trim()
      ? {
          company: bag.company.trim() || undefined,
          targetRole: bag.targetRole.trim(),
          // 岗位必须最新，默认限定近一个月
          freshness: "recent",
        }
      : null,
  inputLogic: (input) =>
    `查询串由公司+职位拼装：${[input.company, input.targetRole].filter(Boolean).join(" ")}；freshness=${input.freshness}`,
  validateOutput: (output) =>
    !output.configured
      ? ["未配置搜索服务"]
      : output.results.length
        ? []
        : ["搜索没有返回可用结果"],
  collect: (bag, output) => {
    bag.sources.push(...output.sources);
    // 参数自动传递：搜索结果 URL 直接成为抓取工具的入参来源
    bag.pendingUrls = [
      ...bag.pendingUrls,
      ...output.results.slice(0, 2).map((result) => result.url),
    ];
  },
  degrade: () => "无外部岗位证据可用，改用用户提供的岗位描述，并在限制说明中如实标注",
};

/** 确定性关键词提取。正文来自已确认的研究包 */
export const ATS_KEYWORDS_SPEC: ToolSpec<{ description: string }, string[]> = {
  tool: "resume_extract_ats_keywords",
  phase: "jd_analysis",
  reason: "ATS 命中率取决于关键词覆盖，需要确定性提取而非模型猜测",
  expected: "返回按频次排序的岗位关键词列表",
  adapt: (bag) => {
    const description = (bag.research?.postings || [])
      .map((posting) => posting.description)
      .join("\n")
      .trim();
    return description ? { description } : null;
  },
  inputLogic: (input) => `正文为研究包内全部岗位描述拼接（${input.description.length} 字）`,
  validateOutput: (output) => (output.length ? [] : ["未提取到任何关键词"]),
  collect: (bag, output) => {
    bag.keywords = [...new Set([...bag.keywords, ...output])];
  },
  degrade: () => "沿用研究包自带的 requiredKeywords 继续评估",
};

/** 匹配度与缺口评估。同时需要草稿与研究包 */
export const SKILL_GAP_SPEC: ToolSpec<
  { draft: ResumeDraft; research: JobResearchBundle },
  CareerOpsEvaluation
> = {
  tool: "resume_analyze_skill_gap",
  phase: "career_ops_evaluation",
  reason: "定制前必须先算清哪些要求有证据支撑、哪些是真实缺口",
  expected: "返回匹配度、已支撑技能、技能缺口与招聘者风险",
  adapt: (bag) =>
    bag.draft && bag.research ? { draft: bag.draft, research: bag.research } : null,
  inputLogic: (input) =>
    `草稿取自 checkpoint，岗位要求取自研究包（${input.research.requiredKeywords.length} 个关键词）`,
  validateOutput: (output) =>
    Number.isFinite(output.matchScore) ? [] : ["匹配度计算结果非法"],
  collect: (bag, output) => {
    bag.evaluation = output;
  },
  degrade: () => "跳过定制步骤，保留候选人事实草稿并在对话中说明缺少岗位评估",
};

/** 证据排序。输出只用于观测，缺失不阻断流程 */
export const RANK_EVIDENCE_SPEC: ToolSpec<
  { draft: ResumeDraft; research: JobResearchBundle },
  string[]
> = {
  tool: "resume_rank_evidence",
  phase: "career_ops_evaluation",
  reason: "让定制阶段优先使用与岗位最相关的真实经历",
  expected: "返回按岗位关键词命中数排序的经历证据",
  adapt: (bag) =>
    bag.draft && bag.research ? { draft: bag.draft, research: bag.research } : null,
  inputLogic: (input) =>
    `候选证据取自草稿的 ${input.draft.experience.length} 段经历与 ${input.draft.projects.length} 个项目`,
  degrade: () => "定制阶段直接使用未排序的原始经历",
};

/** 招聘者视角风险图。纯派生，不会失败 */
export const RECRUITER_RISK_SPEC: ToolSpec<
  { evaluation: CareerOpsEvaluation },
  string[]
> = {
  tool: "resume_build_recruiter_risk_map",
  phase: "career_ops_evaluation",
  reason: "把评估结果翻译成招聘者会追问的点，供事实门禁与澄清使用",
  expected: "返回招聘者视角的风险与证明材料缺口",
  adapt: (bag) => (bag.evaluation ? { evaluation: bag.evaluation } : null),
  inputLogic: (input) => `取自上一步评估结果，当前匹配度 ${input.evaluation.matchScore}`,
  degrade: () => "跳过风险图，事实门禁仍会独立校验草稿",
};

/** 事实门禁。这一步没有降级方案——门禁被跳过等于放行未核验内容 */
export const FACT_GATE_SPEC: ToolSpec<{ draft: ResumeDraft }, string[]> = {
  tool: "resume_validate_draft_facts",
  phase: "fact_gate",
  reason: "交付前必须校验数字、日期与能力声明是否有证据支撑",
  expected: "返回待核验事实清单；为空表示门禁通过",
  adapt: (bag) => (bag.draft ? { draft: bag.draft } : null),
  inputLogic: (input) =>
    `校验对象为当前草稿的 ${input.draft.experience.length + input.draft.projects.length} 段经历`,
  degrade: () => null,
};


