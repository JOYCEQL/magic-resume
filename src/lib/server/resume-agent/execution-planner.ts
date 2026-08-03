import type { ResumeDraft } from "@/types/resume-agent";

/**
 * 任务规划层：执行任何工具之前，先按当前状态推导出本轮的完整步骤序列、
 * 每步依赖的工具与依赖关系，作为一个「路径规划」节点写进思维链。
 *
 * 为什么要有这一层：原先的顺序隐含在 runner 的一串 if 里，用户看不到「打算做什么」，
 * 只能看到「做完了什么」；工具依赖也无处声明。规划层把顺序显式化，让思维链能在
 * 执行前给出可核对的计划，也让跳步原因（已完成 / 依赖不满足）变成可展示的结论。
 *
 * 规划层不执行任何工具，只做纯推导。
 */

export type PlanStepId =
  | "intent"
  | "candidate_facts"
  | "target_definition"
  | "job_discovery"
  | "jd_analysis"
  | "career_ops_evaluation"
  | "resume_tailoring"
  | "fact_gate"
  | "clarification";

export interface PlanStep {
  id: PlanStepId;
  title: string;
  /** 该步会用到的工具（可能为空：纯模型步骤或纯派生步骤） */
  tools: string[];
  /** 依赖的前置步骤 id；调度层据此判断能否执行 */
  dependsOn: PlanStepId[];
  /** 本轮是否需要执行 */
  planned: boolean;
  /**
   * 待定：能否执行取决于本轮更早步骤的产出（首轮的目标公司要等事实提取才知道）。
   * 规划早于执行，所以这类步骤只能标待定，不能谎报"跳过"。
   */
  tentative?: boolean;
  /** planned=false 时的原因，写进思维链，避免「静默跳过」 */
  skipReason?: string;
  /** 是否为模型调用步骤（供思维链区分工具与模型） */
  usesModel?: boolean;
}

export interface PlanInput {
  /** 本轮是否需要意图分流（作答 / 方向选择跳过） */
  needsIntentRouting: boolean;
  completedSteps: string[];
  draft: ResumeDraft | null;
  hasResearch: boolean;
  /** 用户是否已给出目标公司 */
  hasCompany: boolean;
  /** 本轮消息或草稿里是否有公开 JD 链接 */
  hasJdUrls: boolean;
  /** 用户是否直接粘贴了足够长的 JD 正文 */
  hasSuppliedJd: boolean;
  /** 画像是否足以做方向发现 */
  hasEnoughProfile: boolean;
}

export interface ExecutionPlan {
  steps: PlanStep[];
  /** 一句话计划摘要，作为思维链节点的实际产出 */
  summary: string;
}

const STEP_TITLES: Record<PlanStepId, string> = {
  intent: "判断本轮意图（闲聊 / 简历）",
  candidate_facts: "提取候选人事实",
  target_definition: "确定目标岗位并调研",
  job_discovery: "发现并读取公开岗位",
  jd_analysis: "提取 ATS 关键词",
  career_ops_evaluation: "评估匹配度与风险",
  resume_tailoring: "定制简历草稿",
  fact_gate: "执行事实门禁",
  clarification: "生成澄清计划并等待确认",
};

/**
 * 推导本轮执行计划。
 *
 * 判断依据全部来自 checkpoint 与草稿状态：已完成的步骤不重跑（避免重复计费），
 * 依赖不满足的步骤标注原因而不是悄悄跳过。
 */
export const planExecution = (input: PlanInput): ExecutionPlan => {
  const done = new Set(input.completedSteps);
  const steps: PlanStep[] = [];

  steps.push({
    id: "intent",
    title: STEP_TITLES.intent,
    tools: [],
    dependsOn: [],
    usesModel: true,
    planned: input.needsIntentRouting,
    skipReason: input.needsIntentRouting
      ? undefined
      : "本轮是作答或方向选择，属明确的简历操作，无需分流",
  });

  const factsPlanned = !done.has("candidate_facts");
  steps.push({
    id: "candidate_facts",
    title: STEP_TITLES.candidate_facts,
    tools: [],
    dependsOn: ["intent"],
    usesModel: true,
    planned: factsPlanned,
    skipReason: factsPlanned ? undefined : "检查点已有候选人事实，跳过重复提取",
  });

  // 首轮草稿还没生成，目标公司/画像要等 candidate_facts 才知道。
  // 这种情况下调研及其下游只能标「待定」，不能谎报「无法搜索」。
  const targetUnknown = factsPlanned && !input.hasCompany && !input.hasJdUrls && !input.hasSuppliedJd;
  const researchDone = done.has("job_research");
  const canResearch = input.hasCompany || input.hasJdUrls || input.hasSuppliedJd;

  steps.push({
    id: "target_definition",
    title: STEP_TITLES.target_definition,
    tools: [],
    dependsOn: ["candidate_facts"],
    planned: !researchDone,
    skipReason: researchDone ? "目标未变化，沿用上一轮岗位调研结果" : undefined,
  });
  steps.push({
    id: "job_discovery",
    title: canResearch || targetUnknown ? STEP_TITLES.job_discovery : "无目标公司，先发现候选方向",
    tools: [
      "resume_discover_job_postings",
      "resume_web_search",
      "resume_fetch_job_posting",
      "resume_extract_job_posting",
    ],
    dependsOn: ["target_definition"],
    planned: !researchDone && (canResearch || targetUnknown || input.hasEnoughProfile),
    tentative: !researchDone && targetUnknown,
    skipReason: researchDone
      ? "已有调研结果"
      : canResearch || targetUnknown || input.hasEnoughProfile
        ? undefined
        : "既无目标公司也无足够画像，无法搜索，等用户补充",
  });

  // 下游三步同样待定：本轮能否执行取决于调研是否拿到岗位证据
  const researchLikely = input.hasResearch || (!researchDone && (canResearch || targetUnknown));
  const downstreamTentative = !input.hasResearch && targetUnknown;
  steps.push({
    id: "jd_analysis",
    title: STEP_TITLES.jd_analysis,
    tools: ["resume_extract_ats_keywords"],
    dependsOn: ["job_discovery"],
    planned: researchLikely && !done.has("jd_analysis"),
    tentative: downstreamTentative,
    skipReason: done.has("jd_analysis")
      ? "已完成关键词分析"
      : researchLikely
        ? undefined
        : "尚无岗位调研结果，无法提取关键词",
  });
  steps.push({
    id: "career_ops_evaluation",
    title: STEP_TITLES.career_ops_evaluation,
    tools: [
      "resume_analyze_skill_gap",
      "resume_rank_evidence",
      "resume_build_recruiter_risk_map",
    ],
    dependsOn: ["jd_analysis"],
    planned: researchLikely && !done.has("career_ops_evaluation"),
    tentative: downstreamTentative,
    skipReason: done.has("career_ops_evaluation")
      ? "已完成匹配度评估"
      : researchLikely
        ? undefined
        : "缺少岗位要求，无法评估匹配度",
  });
  steps.push({
    id: "resume_tailoring",
    title: STEP_TITLES.resume_tailoring,
    tools: [],
    dependsOn: ["career_ops_evaluation"],
    usesModel: true,
    planned: researchLikely && !done.has("resume_tailoring"),
    tentative: downstreamTentative,
    skipReason: done.has("resume_tailoring")
      ? "本轮草稿已定制"
      : researchLikely
        ? undefined
        : "无岗位评估结果，保留候选人事实草稿不做定制",
  });
  steps.push({
    id: "fact_gate",
    title: STEP_TITLES.fact_gate,
    tools: ["resume_validate_draft_facts"],
    dependsOn: ["candidate_facts"],
    planned: !done.has("fact_gate"),
    skipReason: done.has("fact_gate") ? "本轮草稿已通过门禁校验" : undefined,
  });
  steps.push({
    id: "clarification",
    title: STEP_TITLES.clarification,
    tools: [],
    dependsOn: ["fact_gate"],
    planned: true,
  });

  const plannedSteps = steps.filter((step) => step.planned);
  const tentativeCount = plannedSteps.filter((step) => step.tentative).length;
  const skippedCount = steps.length - plannedSteps.length;
  const plannedTools = [...new Set(plannedSteps.flatMap((step) => step.tools))];
  const summary = [
    `本轮计划 ${plannedSteps.length} 步：${plannedSteps.map((step) => step.title).join(" → ")}`,
    plannedTools.length
      ? `涉及工具 ${plannedTools.length} 个：${plannedTools.join("、")}`
      : "本轮无需调用工具",
    tentativeCount ? `其中 ${tentativeCount} 步待定（取决于本轮提取到的目标岗位）` : "",
    skippedCount ? `跳过 ${skippedCount} 步（已完成或依赖不满足）` : "",
  ]
    .filter(Boolean)
    .join("；");

  return { steps, summary };
};

/** 计划的可读清单，作为思维链节点的预期产出展示 */
export const describePlan = (plan: ExecutionPlan) =>
  plan.steps
    .map((step) => {
      const mark = step.planned ? (step.tentative ? "◐" : "●") : "○";
      const tools = step.tools.length ? `｜工具：${step.tools.join("、")}` : "";
      const deps = step.dependsOn.length ? `｜依赖：${step.dependsOn.join("、")}` : "｜无前置依赖";
      const note = step.planned
        ? step.tentative
          ? "｜待定：取决于本轮提取到的目标岗位"
          : ""
        : `｜跳过原因：${step.skipReason}`;
      return `${mark} ${step.title}${deps}${tools}${note}`;
    })
    .join("\n");
