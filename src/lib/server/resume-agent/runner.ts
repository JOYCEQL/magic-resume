import type {
  CareerOpsEvaluation,
  CreateResumeAgentJobRequest,
  DiscoveredDirection,
  JobResearchBundle,
  ResearchSource,
  ResumeAgentIntent,
  ResumeAgentJob,
  ResumeAgentModelCall,
  ResumeAgentProviderPayload,
  ResumeAgentTraceEvent,
  ResumeDraft,
} from "@/types/resume-agent";
import { createEmptyResumeDraft, normalizeResumeDraft } from "@/utils/resumeAgent";
import { runDiscoveryLoop, runResearchAgentLoop, supportsAgentLoop } from "./agent-loop";
import { buildPendingQuestions } from "./clarification";
import { describePlan, planExecution } from "./execution-planner";
import { appendJobEvent, createJob, getJob, saveJob } from "./job-repository";
import { classifyUserIntent, generateResumeDraft } from "./model-adapter";
import { ReasoningChain } from "./reasoning-chain";
import {
  ATS_KEYWORDS_SPEC,
  DISCOVER_POSTINGS_SPEC,
  EXTRACT_POSTING_SPEC,
  FACT_GATE_SPEC,
  FETCH_POSTING_SPEC,
  RANK_EVIDENCE_SPEC,
  RECRUITER_RISK_SPEC,
  SKILL_GAP_SPEC,
  WEB_SEARCH_SPEC,
  runToolStep,
  toolTitle,
  type FetchedPosting,
  type OrchestratorHooks,
  type ToolResultBag,
} from "./tool-orchestrator";
import type { WebSearchOutcome } from "./web-search";

const controllers = new Map<string, AbortController>();
const JOB_BUDGET_MS = Number(process.env.RESUME_AGENT_JOB_BUDGET_MS || 180000);
const MODEL_CALL_HISTORY_LIMIT = 12;

const now = () => new Date().toISOString();
const latestUserText = (messages: CreateResumeAgentJobRequest["messages"]) =>
  [...messages].reverse().find((message) => message.role === "user")?.content || "";
const findPublicUrls = (text: string) =>
  [...text.matchAll(/https:\/\/[^\s<>"'）)\]]+/gi)]
    .map((match) => match[0].replace(/[.,，。；;]+$/, ""))
    .filter((url, index, urls) => urls.indexOf(url) === index)
    .slice(0, 5);

const emitTrace = async (
  job: ResumeAgentJob,
  event: Omit<ResumeAgentTraceEvent, "id">
) => {
  const trace = { id: crypto.randomUUID(), ...event };
  await appendJobEvent(job.id, "trace.updated", { trace });
  return trace;
};

const WORKFLOW_PHASES: ResumeAgentJob["phase"][] = [
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
];

const phaseReached = (job: ResumeAgentJob, phase: ResumeAgentJob["phase"]) =>
  WORKFLOW_PHASES.indexOf(job.checkpoint.phase) >= WORKFLOW_PHASES.indexOf(phase);

const normalizeCheckpoint = (job: ResumeAgentJob) => {
  if (job.checkpoint.stateVersion === 1) {
    const migratedSteps = [
      ...(phaseReached(job, "target_definition") ? ["candidate_facts"] : []),
      ...(phaseReached(job, "jd_analysis") ? ["job_research"] : []),
      ...(phaseReached(job, "career_ops_evaluation") ? ["jd_analysis"] : []),
      ...(phaseReached(job, "resume_tailoring") ? ["career_ops_evaluation"] : []),
      ...(phaseReached(job, "fact_gate") ? ["resume_tailoring"] : []),
      ...(phaseReached(job, "user_confirmation") ? ["fact_gate"] : []),
    ];
    job.checkpoint.completedSteps = [
      ...new Set([...(job.checkpoint.completedSteps || []), ...migratedSteps]),
    ];
  }
  job.checkpoint.stateVersion = 3;
  job.checkpoint.completedSteps ||= [];
  job.checkpoint.factIssues ||= [];
  job.checkpoint.pendingQuestions ||= [];
  job.checkpoint.answeredQuestions ||= [];
  job.checkpoint.intentSkipped ||= false;
  job.modelCalls ||= [];
};

/** 记录一次模型调用；reasoning 仅在用户显式开启时才带内容 */
const recordModelCall = async (
  job: ResumeAgentJob,
  call: Omit<ResumeAgentModelCall, "id">
) => {
  job.modelCalls = [
    ...(job.modelCalls || []),
    { id: crypto.randomUUID(), ...call },
  ].slice(-MODEL_CALL_HISTORY_LIMIT);
  if (call.reasoning) {
    await appendJobEvent(job.id, "model.reasoning", {
      phase: call.phase,
      model: call.model,
      reasoning: call.reasoning,
      status: call.status,
    });
  }
};

const saveCheckpoint = async (job: ResumeAgentJob) => {
  normalizeCheckpoint(job);
  job.updatedAt = now();
  job.checkpoint.updatedAt = job.updatedAt;
  await saveJob(job);
  await appendJobEvent(job.id, "checkpoint.saved", {
    phase: job.phase,
    step: job.checkpoint.step,
    status: job.status,
    completedSteps: job.checkpoint.completedSteps,
  });
};

const changePhase = async (job: ResumeAgentJob, phase: ResumeAgentJob["phase"]) => {
  if (job.phase === phase && job.checkpoint.phase === phase) return;
  job.phase = phase;
  job.checkpoint.phase = phase;
  job.checkpoint.step += 1;
  await appendJobEvent(job.id, "phase.changed", { phase, step: job.checkpoint.step });
  await saveCheckpoint(job);
};

const hasCompletedStep = (job: ResumeAgentJob, step: string) =>
  job.checkpoint.completedSteps.includes(step);

const completeStep = async (job: ResumeAgentJob, step: string) => {
  if (!hasCompletedStep(job, step)) job.checkpoint.completedSteps.push(step);
  await saveCheckpoint(job);
};

/** 工具标题与调度契约集中在 tool-orchestrator，runner 只复用不再自己维护一份 */

const LOOP_STOP_REASONS: Record<string, string> = {
  model_finished: "模型判断证据已足够",
  max_iterations: "达到迭代上限",
  max_tool_calls: "达到工具调用上限",
  budget: "达到时间预算",
  unsupported: "当前模型不支持工具调用",
  error: "调研规划失败",
};

/**
 * 每个 Job 一条思维链。emitTrace 是它唯一的输出通道，所以节点事件与旧 trace
 * 事件走同一条时间线，前端不需要两套接收逻辑。
 */
const createChain = (job: ResumeAgentJob) =>
  new ReasoningChain((event) => emitTrace(job, event));

/** 工具调度层需要的回调：事件记录与检查点保存仍归 runner */
const orchestratorHooks = (
  job: ResumeAgentJob,
  chain: ReasoningChain,
  signal: AbortSignal
): OrchestratorHooks => ({
  jobId: job.id,
  signal,
  chain,
  onToolStart: async (tool, phase) => {
    await appendJobEvent(job.id, "tool.started", { tool, phase });
  },
  onToolSettled: async (tool, invocation, error) => {
    if (invocation) job.invocations.push(invocation);
    if (error) {
      await appendJobEvent(job.id, "tool.failed", {
        tool,
        error: error instanceof Error ? error.message : String(error),
      });
    } else if (invocation) {
      await appendJobEvent(job.id, "tool.completed", { invocation });
    }
    await saveCheckpoint(job);
  },
});

const mergeBundles = (
  bundles: JobResearchBundle[],
  company: string,
  role: string,
  extraSources: ResearchSource[] = [],
  extraLimitations: string[] = []
): JobResearchBundle => {
  const postings = bundles
    .flatMap((bundle) => bundle.postings)
    .filter((posting, index, all) =>
      all.findIndex((candidate) => candidate.fingerprint === posting.fingerprint) === index
    );
  // 按 URL 去重；无 URL 的来源（如用户粘贴的 JD）一律保留，
  // 不能用 findIndex 匹配 url —— 那会让 url 为空的来源整体被丢掉。
  const seenUrls = new Set<string>();
  const sources = [...bundles.flatMap((bundle) => bundle.sources), ...extraSources].filter(
    (source) => {
      if (!source.url) return true;
      if (seenUrls.has(source.url)) return false;
      seenUrls.add(source.url);
      return true;
    }
  );
  return {
    targetCompany: company,
    targetRole: role,
    postings,
    sources,
    commonResponsibilities: [...new Set(bundles.flatMap((bundle) => bundle.commonResponsibilities))].slice(0, 15),
    requiredKeywords: [...new Set(bundles.flatMap((bundle) => bundle.requiredKeywords))].slice(0, 25),
    preferredKeywords: [...new Set(bundles.flatMap((bundle) => bundle.preferredKeywords))].slice(0, 15),
    companyInsights: [],
    limitations: [
      ...new Set([
        ...bundles.flatMap((bundle) => bundle.limitations),
        ...extraLimitations,
        ...(postings.some((posting) => posting.status !== "active")
          ? ["部分岗位页面状态不明确或已失效，定制结果仅采用仍可核验的岗位证据"]
          : []),
      ]),
    ],
  };
};

/**
 * 模型驱动的调研循环。工具由模型自主选择，但循环本身受迭代/调用/时间三重预算约束，
 * 且只能产出调研证据——事实门禁与简历定制仍由下方确定性流程负责。
 * 任何失败都回退到 researchTargetJobDeterministic，不让 Job 因此中断。
 */
const researchTargetJobWithLoop = async (
  job: ResumeAgentJob,
  draft: ResumeDraft,
  provider: ResumeAgentProviderPayload,
  latestInput: string,
  signal: AbortSignal
): Promise<JobResearchBundle | null> => {
  const target = draft.targetJob;
  const company = target.company.trim();
  const role = target.title.trim();
  // 没有目标公司时不进循环：模型会拿着职位名去猜公司（实测猜了 NetEase、
  // Alibaba、Hikvision、Shopee、Stripe），既拿不到与候选人真正相关的岗位，
  // 又白烧 6 次 ATS 查询和一次模型调用的预算。
  if (!company) return null;

  await changePhase(job, "job_discovery");
  await emitTrace(job, {
    stage: "research-loop",
    title: "模型正在自主规划岗位调研",
    detail: "工具选择由模型决定；迭代、调用次数和时间均有上限，事实门禁不受影响",
    status: "running",
  });

  const loop = await runResearchAgentLoop({
    jobId: job.id,
    phase: job.phase,
    provider,
    company,
    targetRole: role,
    userSuppliedContext: `${latestInput}\n${target.jobDescription}`.trim(),
    signal,
    captureReasoning: job.input.exposeReasoning,
    onToolStart: async (tool, input) => {
      await emitTrace(job, {
        stage: tool,
        title: toolTitle(tool),
        status: "running",
        tool,
      });
      await appendJobEvent(job.id, "tool.started", { tool, phase: job.phase, input: undefined });
    },
    onToolSettled: async (tool, invocation, error) => {
      if (invocation) job.invocations.push(invocation);
      if (error) {
        await appendJobEvent(job.id, "tool.failed", {
          tool,
          error: error instanceof Error ? error.message : String(error),
        });
      } else if (invocation) {
        await appendJobEvent(job.id, "tool.completed", { invocation });
        await emitTrace(job, {
          stage: tool,
          title: toolTitle(tool).replace("正在", "已完成"),
          detail: invocation.outputSummary,
          status: "completed",
          tool,
        });
      }
      await saveCheckpoint(job);
    },
    onReasoning: async (reasoning) => {
      await recordModelCall(job, {
        phase: job.phase,
        model: provider.model,
        status: "completed",
        reasoning,
        startedAt: now(),
        completedAt: now(),
      });
    },
  });

  await emitTrace(job, {
    stage: "research-loop",
    title: "已完成模型自主调研",
    detail: `${loop.iterations} 轮规划 · ${loop.toolCallCount} 次工具调用 · 停止原因：${LOOP_STOP_REASONS[loop.stopReason] || loop.stopReason}`,
    status: loop.stopReason === "error" || loop.stopReason === "unsupported" ? "warning" : "completed",
    sourceCount: loop.sources.length,
  });

  // 循环没拿到任何岗位证据时不接受它的结论，回退到确定性流程
  if (!loop.bundles.some((bundle) => bundle.postings.length)) return null;
  return mergeBundles(
    loop.bundles,
    company || target.company,
    role || target.title,
    loop.sources,
    [...loop.limitations, ...(loop.summary ? [`调研说明：${loop.summary}`] : [])]
  );
};

/**
 * 确定性调研路径，三条子路径共用一个参数袋，按声明式闭环逐步执行：
 * A 用户给了 JD 链接 → 抓取 + 抽取；B 有公司 → 查 ATS，未命中转通用搜索并抓取
 * 搜索结果；C 用户粘贴了 JD 正文 → 直接抽取。
 * 每一步的入参校验、失败重试、降级与跳过原因都由 runToolStep 写进思维链。
 */
const researchTargetJobDeterministic = async (
  job: ResumeAgentJob,
  draft: ResumeDraft,
  latestInput: string,
  chain: ReasoningChain,
  signal: AbortSignal
): Promise<JobResearchBundle | null> => {
  const target = draft.targetJob;
  const hooks = orchestratorHooks(job, chain, signal);
  const bag: ToolResultBag = {
    company: target.company.trim(),
    targetRole: target.title.trim(),
    jobDescription: "",
    pendingUrls: findPublicUrls(`${latestInput}\n${target.jobDescription}`),
    sources: [],
    keywords: [],
    draft,
    research: job.checkpoint.research || undefined,
  };
  const bundles: JobResearchBundle[] = [];

  /**
   * 抓取队列直到清空。成功与降级都会消费队首，故循环必然收敛；
   * failed（取消 / 预算耗尽）不消费队首，必须显式跳出，否则会空转。
   */
  const drainUrlQueue = async () => {
    while (bag.pendingUrls.length) {
      if (signal.aborted) break;
      const fetched = await runToolStep(FETCH_POSTING_SPEC, bag, hooks);
      if (fetched.state === "failed") break;
      if (fetched.state !== "completed") continue;
      if (job.phase !== "job_research") await changePhase(job, "job_research");
      const extracted = await runToolStep(EXTRACT_POSTING_SPEC, bag, hooks);
      if (extracted.state === "completed") bundles.push(extracted.output as JobResearchBundle);
      else if (extracted.state === "failed") break;
    }
  };

  // A：用户直接给了岗位链接，优先按链接调研
  if (bag.pendingUrls.length) {
    await changePhase(job, "job_discovery");
    await drainUrlQueue();
    if (bundles.length) {
      return mergeBundles(bundles, target.company, target.title, bag.sources);
    }
  }

  // B：有公司与职位，先查公共 ATS，未命中转通用搜索
  if (bag.company && bag.targetRole) {
    await changePhase(job, "job_discovery");
    const discovered = await runToolStep(DISCOVER_POSTINGS_SPEC, bag, hooks);
    if (discovered.state === "completed") return discovered.output as JobResearchBundle;
    // ATS 已尝试但无结果的 bundle 仍要保留：它带着「查过哪些源」的说明
    const attempted =
      discovered.state === "degraded" ? (discovered.output as JobResearchBundle | undefined) : undefined;
    const searched = await runToolStep(WEB_SEARCH_SPEC, bag, hooks);
    const searchOutcome =
      searched.state === "completed" ? (searched.output as WebSearchOutcome) : undefined;
    // 参数自动传递：搜索结果 URL 已由 spec.collect 写进 pendingUrls
    await drainUrlQueue();
    if (bundles.some((bundle) => bundle.postings.length)) {
      return mergeBundles(bundles, target.company, target.title, bag.sources);
    }
    if (attempted) {
      // 没拿到岗位证据时也要落下「为什么没有」，否则用户只看到一个空结果
      job.checkpoint.research = {
        ...attempted,
        sources: [...attempted.sources, ...bag.sources],
        limitations: [
          ...attempted.limitations,
          ...(searchOutcome?.limitation ? [searchOutcome.limitation] : []),
        ],
      };
      await saveCheckpoint(job);
    }
  }

  // C：用户粘贴了足够长的 JD 正文，构造 user 来源走同一条抽取闭环
  const suppliedDescription = target.jobDescription.trim();
  if (suppliedDescription.length >= 120) {
    if (job.phase !== "job_research") await changePhase(job, "job_research");
    bag.jobDescription = suppliedDescription;
    bag.fetched = {
      source: {
        id: crypto.randomUUID(),
        type: "user",
        title: "用户提供的岗位描述",
        retrievedAt: now(),
        trustScore: 70,
        excerpt: suppliedDescription.slice(0, 500),
      },
      text: suppliedDescription,
      status: "uncertain",
    } satisfies FetchedPosting;
    const extracted = await runToolStep(EXTRACT_POSTING_SPEC, bag, hooks);
    if (extracted.state === "completed") return extracted.output as JobResearchBundle;
  }
  return null;
};

/** 候选人画像摘要：喂给发现循环做广域搜索的输入 */
const buildCandidateProfile = (draft: ResumeDraft, latestInput: string) => {
  const parts = [
    draft.basic.title && `目标方向：${draft.basic.title}`,
    draft.basic.location && `城市：${draft.basic.location}`,
    draft.skills.length && `技能：${draft.skills.slice(0, 20).join("、")}`,
    draft.experience.length &&
      `经历：${draft.experience
        .slice(0, 3)
        .map((item) => [item.position, item.company, item.date].filter(Boolean).join(" @ "))
        .join("；")}`,
    draft.summary && `自述：${draft.summary.slice(0, 300)}`,
    latestInput && `本轮输入：${latestInput.slice(0, 800)}`,
  ].filter(Boolean);
  return parts.join("\n");
};

/** 有技能或经历才值得做方向发现；纯空草稿搜出来的只会是噪音 */
const hasEnoughProfile = (draft: ResumeDraft) =>
  draft.skills.length > 0 || draft.experience.length > 0 || Boolean(draft.summary.trim());

/**
 * 阶段一：用户没给目标公司时，模型自主广域搜索并给出可选方向。
 * 产出写入 checkpoint.discoveredDirections，Job 转 waiting_user 等用户选择；
 * 不产出调研 bundle——精确调研要等用户选定公司后的下一轮。
 */
const discoverDirections = async (
  job: ResumeAgentJob,
  draft: ResumeDraft,
  provider: ResumeAgentProviderPayload,
  latestInput: string,
  signal: AbortSignal
): Promise<DiscoveredDirection[]> => {
  await changePhase(job, "job_discovery");
  await emitTrace(job, {
    stage: "discovery-loop",
    title: "未指定目标公司，正在自主搜索匹配方向",
    detail: "基于你的技能与经历做广域搜索；公司与链接均来自真实搜索结果，不编造",
    status: "running",
  });

  const discovery = await runDiscoveryLoop({
    jobId: job.id,
    provider,
    candidateProfile: buildCandidateProfile(draft, latestInput),
    targetRole: draft.targetJob.title || draft.basic.title,
    signal,
    captureReasoning: job.input.exposeReasoning,
    onToolStart: async (tool, input) => {
      await emitTrace(job, {
        stage: tool,
        title: toolTitle(tool),
        status: "running",
        tool,
      });
      await appendJobEvent(job.id, "tool.started", { tool, phase: job.phase, input: undefined });
    },
    onToolSettled: async (tool, invocation, error) => {
      if (invocation) job.invocations.push(invocation);
      if (error) {
        await appendJobEvent(job.id, "tool.failed", {
          tool,
          error: error instanceof Error ? error.message : String(error),
        });
      } else if (invocation) {
        await appendJobEvent(job.id, "tool.completed", { invocation });
        await emitTrace(job, {
          stage: tool,
          title: toolTitle(tool).replace("正在", "已完成"),
          detail: invocation.outputSummary,
          status: "completed",
          tool,
        });
      }
      await saveCheckpoint(job);
    },
    onReasoning: async (reasoning) => {
      await recordModelCall(job, {
        phase: job.phase,
        model: provider.model,
        status: "completed",
        reasoning,
        startedAt: now(),
        completedAt: now(),
      });
    },
  });

  // 来源条数按方向平摊，供前端展示证据强度
  const directions = discovery.directions.map((direction) => ({
    ...direction,
    searchSourceCount: discovery.sources.length,
  }));

  await emitTrace(job, {
    stage: "discovery-loop",
    title: directions.length
      ? `已发现 ${directions.length} 个匹配方向，等待你选择`
      : "未能发现可用方向",
    detail: directions.length
      ? `${discovery.iterations} 轮规划 · ${discovery.toolCallCount} 次搜索`
      : discovery.limitations.join("；") || "搜索没有返回可用结果",
    status: directions.length ? "completed" : "warning",
    sourceCount: discovery.sources.length,
  });
  return directions;
};

/**
 * 调研入口：优先让模型自主规划（工具选择、次数、终止都由它决定），
 * 循环无产出或不可用时回退到确定性路径。两条路径都不改变后续工作流顺序。
 */
const researchTargetJob = async (
  job: ResumeAgentJob,
  draft: ResumeDraft,
  provider: ResumeAgentProviderPayload,
  latestInput: string,
  chain: ReasoningChain,
  signal: AbortSignal
): Promise<JobResearchBundle | null> => {
  // 用户直接给了 JD URL 时无需规划，确定性路径更快且更可控
  const hasExplicitUrls = findPublicUrls(`${latestInput}\n${draft.targetJob.jobDescription}`).length > 0;
  if (!hasExplicitUrls && supportsAgentLoop(provider.modelType)) {
    const node = await chain.node({
      stage: "execution",
      title: "模型自主规划岗位调研",
      basis: "已有目标公司且模型支持工具调用，让模型自主选择调研路径比固定顺序更省调用",
      action: "在迭代/调用次数/时间三重预算内运行调研循环",
      expectation: "产出含真实岗位条目的调研证据；无产出则回退固定流程",
    });
    try {
      const looped = await researchTargetJobWithLoop(job, draft, provider, latestInput, signal);
      if (looped) {
        await node.pass(
          `自主调研产出 ${looped.postings.length} 个岗位、${looped.sources.length} 个来源`
        );
        return looped;
      }
      await node.degrade("自主调研未取得可用岗位证据", {
        kind: "tool_failure",
        reason: "循环结束时没有任何岗位条目，其结论不可采信",
        recovery: "回退到确定性调研路径：按 ATS / 通用搜索 / 用户 JD 依次尝试",
      });
    } catch (error) {
      if (signal.aborted) throw error;
      await node.degrade(`自主调研中断：${error instanceof Error ? error.message : String(error)}`, {
        kind: "tool_failure",
        reason: error instanceof Error ? error.message : String(error),
        recovery: "回退到确定性调研路径，已获取的来源仍会保留",
      });
      await emitTrace(job, {
        stage: "research-loop",
        title: "模型自主调研未完成，已回退到固定调研流程",
        detail: error instanceof Error ? error.message : String(error),
        status: "warning",
      });
    }
  }
  return researchTargetJobDeterministic(job, draft, latestInput, chain, signal);
};

const executeJob = async (
  jobId: string,
  provider: ResumeAgentProviderPayload,
  externalSignal?: AbortSignal
) => {
  const job = await getJob(jobId);
  if (!job) throw new Error("Resume Agent Job 不存在");
  const controller = new AbortController();
  controllers.set(jobId, controller);
  const timeout = setTimeout(() => controller.abort("job-budget"), JOB_BUDGET_MS);
  const signal = externalSignal
    ? AbortSignal.any([externalSignal, controller.signal])
    : controller.signal;
  // 本轮的思维链。所有阶段共用一条，节点编号连续，便于前端按阶段分组
  const chain = createChain(job);
  try {
    job.status = "running";
    const isFirstRun = !job.startedAt;
    job.startedAt ||= now();
    job.updatedAt = now();
    job.error = undefined;
    await saveJob(job);
    await appendJobEvent(job.id, "job.started", { runtime: "native", budgetMs: JOB_BUDGET_MS });
    if (isFirstRun) {
      await emitTrace(job, {
        stage: "native-runtime",
        title: "已启动 Magic Resume 原生简历 Agent",
        detail: "由显式工作流控制工具、事实门禁、预算和停止，不依赖 OpenCode sidecar",
        status: "completed",
      });
    } else {
      // 续聊 / 恢复 / 作答：Job 已跑过一轮，时间线沿用旧步骤，不再重复「已启动」欢迎语，
      // 改为一条信息性的「继续定制」里程碑。standalone milestone 没有后续 completed
      // 事件（store 只结算 phase 步骤），所以直接以 completed 状态发出，避免永远转圈。
      await emitTrace(job, {
        stage: "continue-runtime",
        title: "继续本轮对话定制简历",
        detail: "沿用已提取的候选人事实与岗位调研，仅根据你的新消息更新草稿；如目标变化会自动重新调研",
        status: "completed",
      });
    }

    normalizeCheckpoint(job);

    // ── 阶段一：需求拆解与对齐 ──────────────────────────────────────────
    // 输入框消息（新建 / 续聊）每轮先由模型判断意图。纯聊天（问候/闲聊/道谢/
    // 问能力）直接返回一条带引导的回复并进入 waiting_user，不启动工作流、不调
    // 任何工具；识别到简历素材或制作/修改请求才继续。闲聊轮次不标记任何步骤，
    // 所以下一条消息会再次分流，直到真正进入简历流程。作答与方向选择是明确的
    // 简历操作，调用方已设置 intentSkipped 跳过本层。
    chain.enter("requirement");
    const skipIntent = job.checkpoint.intentSkipped === true;
    job.checkpoint.intentSkipped = false;
    if (!skipIntent) {
      const intentNode = await chain.node({
        title: "判断本轮意图",
        basis: "输入框消息可能是闲聊也可能带简历素材；无差别启动工作流会浪费上游 token",
        action: "对最近 6 条消息做一次轻量意图分类",
        expectation: "得到 chat（附带引导回复）或 resume 两种结论之一",
      });
      let intent: ResumeAgentIntent = "resume";
      let chatReply = "";
      try {
        const classified = await classifyUserIntent(
          provider,
          job.input.locale,
          job.input.messages,
          signal
        );
        intent = classified.intent;
        chatReply = classified.reply || "";
      } catch (error) {
        // 分类失败保守按 resume 处理：宁可多跑工作流，也不丢用户可能给的素材
        await intentNode.degrade("意图分类调用失败，保守按简历意图继续", {
          kind: "tool_failure",
          reason: error instanceof Error ? error.message : String(error),
          recovery: "按 resume 处理：宁可多跑一轮工作流，也不丢弃用户可能提供的素材",
        });
      }
      if (intent === "chat") {
        const en = job.input.locale.toLowerCase().startsWith("en");
        const reply =
          chatReply ||
          (en
            ? "Hi! I can turn our conversation into a professional resume. Share your basic info and target job (or paste a JD link) and I will start tailoring it for you."
            : "你好！我可以把聊天内容整理成一份专业简历。告诉我你的基本信息和目标岗位（或粘贴 JD 链接），我就开始为你定制。");
        if (chain.active === intentNode) {
          await intentNode.block({
            kind: "missing_info",
            reason: "本轮消息只有闲聊，没有任何可用于简历的事实",
            recovery: "直接回复并给出填写引导，不启动工作流、不调用任何工具，等用户提供素材",
          });
        }
        job.assistantMessage = reply;
        job.checkpoint.pendingQuestion = undefined;
        job.checkpoint.pendingQuestions = [];
        job.checkpoint.factIssues = [];
        job.status = "waiting_user";
        await saveCheckpoint(job);
        await appendJobEvent(job.id, "user.required", {
          question: reply,
          factIssues: [],
          questions: [],
          readyToConfirm: false,
          mode: "chat",
        });
        return;
      }
      if (chain.active === intentNode) {
        await intentNode.pass("识别到简历素材或制作/修改请求，进入候选人事实提取");
      }
    }

    // ── 阶段二：任务路径与工具规划 ──────────────────────────────────────
    // 执行任何工具之前先推导本轮完整步骤、依赖与工具清单，让「打算做什么」
    // 可核对，也让跳步原因（已完成 / 依赖不满足）成为可展示的结论。
    chain.enter("planning");
    const planLatestInput = latestUserText(job.input.messages);
    const planDraft = job.checkpoint.draft;
    const plan = planExecution({
      needsIntentRouting: !skipIntent,
      completedSteps: job.checkpoint.completedSteps,
      draft: planDraft,
      hasResearch: Boolean(job.checkpoint.research),
      hasCompany: Boolean(planDraft?.targetJob.company.trim()),
      hasJdUrls:
        findPublicUrls(`${planLatestInput}\n${planDraft?.targetJob.jobDescription || ""}`).length > 0,
      hasSuppliedJd: (planDraft?.targetJob.jobDescription.trim().length || 0) >= 120,
      hasEnoughProfile: planDraft ? hasEnoughProfile(planDraft) : false,
    });
    const planNode = await chain.node({
      title: "规划本轮执行路径",
      basis: "检查点已完成的步骤不重跑（避免重复调研与重复计费），依赖不满足的步骤标注原因而非静默跳过",
      action: "按当前草稿与检查点状态推导步骤序列、工具清单与依赖关系",
      expectation: describePlan(plan),
    });
    await planNode.pass(plan.summary);

    // ── 阶段三：工具调度与执行 ──────────────────────────────────────────
    chain.enter("execution");
    if (!hasCompletedStep(job, "candidate_facts")) {
      await changePhase(job, "candidate_facts");
      const factsNode = await chain.node({
        title: "提取候选人事实",
        basis: "检查点还没有本轮的候选人事实；定制与门禁都依赖一份结构化草稿",
        action: "把对话内容交给受约束的生成节点，只抽取用户实际提供的事实",
        expectation: "得到结构化草稿与证据清单，缺失项进入 missingFields 而非编造",
      });
      const startedAt = now();
      let initial: Awaited<ReturnType<typeof generateResumeDraft>>;
      try {
        initial = await generateResumeDraft({
          provider,
          locale: job.input.locale,
          conversation: job.input.messages,
          currentDraft: job.checkpoint.draft,
          workflowContext: {
            phase: "candidate_facts",
            instruction: "Extract and preserve candidate facts. Do not claim external job research.",
          },
          signal,
          captureReasoning: job.input.exposeReasoning,
        });
      } catch (error) {
        // 没有降级方案：拿不到草稿，后面每一步都无从下手
        await factsNode.fail({
          kind: "tool_failure",
          reason: error instanceof Error ? error.message : String(error),
          recovery: "无可用降级方案（后续步骤全部依赖草稿），中止本轮并保留检查点供重试",
        });
        throw error;
      }
      await recordModelCall(job, {
        phase: "candidate_facts",
        model: provider.model,
        status: "completed",
        reasoning: initial.reasoning,
        startedAt,
        completedAt: now(),
      });
      job.checkpoint.draft = normalizeResumeDraft(initial.draft, initial.draft.language);
      const factTimestamp = now();
      job.checkpoint.candidateFacts = job.checkpoint.draft.evidence.map((evidence) => ({
        id: crypto.randomUUID(),
        field: evidence.field,
        value: evidence.source,
        status: evidence.confidence === "low" ? "inferred" : "confirmed",
        confidence: evidence.confidence,
        sourceMessageIds: job.input.messages
        .filter((message) =>
          message.role === "user" &&
          message.id &&
          message.content.includes(evidence.source)
        )
        .map((message) => message.id as string),
        createdAt: factTimestamp,
        updatedAt: factTimestamp,
      }));
      job.assistantMessage = initial.assistantMessage;
      await completeStep(job, "candidate_facts");
      const extracted = job.checkpoint.draft;
      await factsNode.pass(
        `确认 ${job.checkpoint.candidateFacts.length} 条证据；${extracted.experience.length} 段经历、${extracted.projects.length} 个项目、${extracted.skills.length} 条技能；待补充 ${extracted.missingFields.length} 项`
      );
    }

    // 续聊目标一致性检测：candidate_facts 重跑后，若目标（公司/职位/JD 链接）与
    // 上一轮调研不一致，则回退调研相关步骤重新调研；一致则保持 job_research
    // completed，跳过重复调研与重复计费。
    if (
      hasCompletedStep(job, "job_research") &&
      job.checkpoint.research &&
      job.checkpoint.draft
    ) {
      const draft = job.checkpoint.draft;
      const research = job.checkpoint.research;
      const latestInput = latestUserText(job.input.messages);
      const companyChanged =
        draft.targetJob.company.trim() &&
        draft.targetJob.company.trim().toLowerCase() !== research.targetCompany.trim().toLowerCase();
      const titleChanged =
        draft.targetJob.title.trim() &&
        draft.targetJob.title.trim().toLowerCase() !== research.targetRole.trim().toLowerCase();
      // 只把「本轮新消息里出现的、上一轮调研没处理过的 URL」当作目标变化信号；
      // 旧草稿 jobDescription 里的 URL 上一轮已处理过，不重复触发重新调研。
      const hasNewUrls = findPublicUrls(latestInput).some(
        (url) => !(research.sources || []).some((source) => source.url === url)
      );
      const consistencyNode = await chain.node({
        title: "校验续聊目标一致性",
        basis: "上一轮已有岗位调研；目标未变时重复调研会重复计费，目标已变时沿用旧证据会张冠李戴",
        action: "比对草稿 targetJob 与调研结果的公司、职位，并检查本轮新出现的 JD 链接",
        expectation: "一致则保留调研结果；不一致则回退调研及其下游步骤",
      });
      if (companyChanged || titleChanged || hasNewUrls) {
        job.checkpoint.completedSteps = job.checkpoint.completedSteps.filter(
          (step) =>
            step !== "job_research" &&
            step !== "jd_analysis" &&
            step !== "career_ops_evaluation" &&
            step !== "resume_tailoring" &&
            step !== "fact_gate"
        );
        job.checkpoint.research = null;
        job.checkpoint.evaluation = null;
        await saveCheckpoint(job);
        await appendJobEvent(job.id, "checkpoint.saved", {
          phase: job.phase,
          step: job.checkpoint.step,
          status: job.status,
          targetChanged: true,
        });
        await consistencyNode.pass(
          `目标已变化（${[companyChanged && "公司", titleChanged && "职位", hasNewUrls && "新增 JD 链接"].filter(Boolean).join("、")}），已回退调研及下游步骤重新执行`
        );
      } else {
        await consistencyNode.skip("目标未变化，保留上一轮岗位调研与评估结果，跳过重复调研");
      }
    }

    if (!job.checkpoint.draft) throw new Error("候选人事实检查点缺少简历草稿");
    if (!hasCompletedStep(job, "job_research")) {
      await changePhase(job, "target_definition");
      const latestInput = latestUserText(job.input.messages);
      const hasCompany = Boolean(job.checkpoint.draft.targetJob.company.trim());
      const hasExplicitJdUrls =
        findPublicUrls(
          `${latestInput}\n${job.checkpoint.draft.targetJob.jobDescription}`
        ).length > 0;

      // 阶段一：没有目标公司也没有 JD 链接时，先自主发现方向让用户选，
      // 而不是静默跳过调研（旧行为）或让模型瞎猜公司。
      if (!hasCompany && !hasExplicitJdUrls && hasEnoughProfile(job.checkpoint.draft)) {
        const discoveryNode = await chain.node({
          title: "发现候选岗位方向",
          basis: "用户没给目标公司也没给 JD 链接，但画像足够；直接猜公司会产出与候选人无关的岗位",
          action: "基于技能与经历做广域搜索，产出真实可点击的方向供用户选择",
          expectation: "3-5 个方向，公司与链接均来自搜索结果",
        });
        const directions = await discoverDirections(
          job,
          job.checkpoint.draft,
          provider,
          latestInput,
          signal
        );
        if (directions.length) {
          job.checkpoint.discoveredDirections = directions;
          job.status = "waiting_user";
          job.checkpoint.pendingQuestion =
            "已根据你的经历找到几个匹配方向，选择一个后我会调研它的最新 JD 并定制简历。";
          job.assistantMessage = job.checkpoint.pendingQuestion;
          await saveCheckpoint(job);
          await appendJobEvent(job.id, "user.required", {
            question: job.checkpoint.pendingQuestion,
            directions,
          });
          await discoveryNode.block({
            kind: "missing_info",
            reason: `已找到 ${directions.length} 个方向，但选哪个只能由用户决定`,
            recovery: "暂停在此，等用户选定方向后进入精确调研",
          });
          return;
        }
        // 发现失败：如实继续后续流程，limitations 里已有说明
        await discoveryNode.degrade("广域搜索未产出可用方向", {
          kind: "tool_failure",
          reason: "搜索没有返回可用结果，或模型未产出结构化方向",
          recovery: "不编造推荐，继续后续流程并在澄清阶段直接询问目标岗位",
        });
      }

      const researched = await researchTargetJob(
        job,
        job.checkpoint.draft,
        provider,
        latestInput,
        chain,
        signal
      );
      // researchTargetJobDeterministic 在 ATS 未命中时会把「已尝试但无结果」的
      // bundle 写进 checkpoint.research 再返回 null；直接赋值会把这份说明冲掉，
      // 用户就看不到「为什么没有岗位证据」。
      job.checkpoint.research = researched ?? job.checkpoint.research;
      await completeStep(job, "job_research");
    }

    const research = job.checkpoint.research;
    // 后续确定性步骤共用一个参数袋，工具间参数由 spec.collect / spec.adapt 传递。
    // sources / keywords 必须复制而非引用 checkpoint 的数组：spec.collect 会 push，
    // 直接引用会把中间结果悄悄写进已保存的调研结果里。
    const bag: ToolResultBag = {
      company: job.checkpoint.draft.targetJob.company.trim(),
      targetRole: job.checkpoint.draft.targetJob.title.trim(),
      jobDescription: "",
      pendingUrls: [],
      sources: [...(research?.sources || [])],
      keywords: [...(research?.requiredKeywords || [])],
      draft: job.checkpoint.draft,
      research: research || undefined,
      evaluation: job.checkpoint.evaluation || undefined,
    };
    const hooks = orchestratorHooks(job, chain, signal);

    if (research && !hasCompletedStep(job, "jd_analysis")) {
      await changePhase(job, "jd_analysis");
      await runToolStep(ATS_KEYWORDS_SPEC, bag, hooks);
      await completeStep(job, "jd_analysis");
    }

    let evaluation = job.checkpoint.evaluation;
    if (research && !hasCompletedStep(job, "career_ops_evaluation")) {
      await changePhase(job, "career_ops_evaluation");
      const evaluated = await runToolStep(SKILL_GAP_SPEC, bag, hooks);
      if (evaluated.state === "completed") {
        evaluation = evaluated.output as CareerOpsEvaluation;
        job.checkpoint.evaluation = evaluation;
        // 证据排序与风险图都依赖评估结果，参数由 bag 自动传递
        await runToolStep(RANK_EVIDENCE_SPEC, bag, hooks);
        await runToolStep(RECRUITER_RISK_SPEC, bag, hooks);
        await completeStep(job, "career_ops_evaluation");
      }
    }

    if (research && evaluation && !hasCompletedStep(job, "resume_tailoring")) {
      await changePhase(job, "resume_tailoring");
      const tailorNode = await chain.node({
        title: "按岗位要求定制草稿",
        basis: `已有岗位调研（${research.requiredKeywords.length} 个关键词）与匹配度评估（${evaluation.matchScore} 分），可以做有依据的改写`,
        action: "把评估结论与调研结果一起交给生成节点，只改写有证据支撑的内容",
        expectation: "改写后的草稿；未被证据支撑的岗位要求保留在 missingSkills",
      });
      const tailoringStartedAt = now();
      try {
        const tailored = await generateResumeDraft({
          provider,
          locale: job.input.locale,
          conversation: job.input.messages,
          currentDraft: job.checkpoint.draft,
          workflowContext: {
            phase: "resume_tailoring",
            research,
            evaluation,
            instruction: "Tailor only with supported candidate evidence. Preserve skill gaps as missing skills.",
          },
          signal,
          captureReasoning: job.input.exposeReasoning,
        });
        await recordModelCall(job, {
          phase: "resume_tailoring",
          model: provider.model,
          status: "completed",
          reasoning: tailored.reasoning,
          startedAt: tailoringStartedAt,
          completedAt: now(),
        });
        job.checkpoint.draft = tailored.draft;
        bag.draft = tailored.draft;
        job.assistantMessage = tailored.assistantMessage;
        await completeStep(job, "resume_tailoring");
        await tailorNode.pass(
          `草稿已定制：${tailored.draft.skills.length} 条技能、${tailored.draft.experience.length} 段经历；保留 ${tailored.draft.targetJob.missingSkills.length} 项能力缺口`
        );
      } catch (error) {
        if (signal.aborted) throw error;
        // 定制失败可降级：候选人事实草稿仍然可用，门禁会照常校验
        await tailorNode.degrade(`定制调用失败：${error instanceof Error ? error.message : String(error)}`, {
          kind: "tool_failure",
          reason: error instanceof Error ? error.message : String(error),
          recovery: "保留候选人事实草稿进入事实门禁，用户可在澄清后重试定制",
        });
      }
    }

    // ── 阶段四：结果整合与合规校验 ──────────────────────────────────────
    chain.enter("validation");
    if (!hasCompletedStep(job, "fact_gate")) {
      await changePhase(job, "fact_gate");
      const gate = await runToolStep(FACT_GATE_SPEC, bag, hooks);
      if (gate.state === "failed") throw gate.error;
      job.checkpoint.factIssues = gate.state === "completed" ? (gate.output as string[]) : [];
      await completeStep(job, "fact_gate");
    }
    const factIssues = job.checkpoint.factIssues;
    const language = job.input.locale.toLowerCase().startsWith("en") ? "en" : "zh";
    const clarifyNode = await chain.node({
      title: "整合结果并生成澄清计划",
      basis: "交付前必须逐条核对：门禁问题、七个板块覆盖情况、目标岗位是否明确",
      action: "汇总门禁结论与草稿缺口，去重后生成结构化澄清问题",
      expectation: "澄清清单为空则可确认入库；非空则停在等待用户补充",
    });
    const pendingQuestions = buildPendingQuestions(
      job.checkpoint.draft,
      factIssues,
      language,
      job.checkpoint.answeredQuestions
    );
    const requiresAnswer = pendingQuestions.length > 0 || !job.checkpoint.draft.targetJob.title;

    await changePhase(job, "user_confirmation");
    job.status = "waiting_user";
    job.checkpoint.pendingQuestions = pendingQuestions;
    job.checkpoint.pendingQuestion = requiresAnswer
      ? pendingQuestions[0]?.question ||
        "请确认右侧草稿中的事实、推断和岗位能力缺口。"
      : "岗位分析、简历定制和事实门禁已完成，请确认事实并选择模板。";
    job.assistantMessage = requiresAnswer
      ? job.assistantMessage || job.checkpoint.pendingQuestion
      : "岗位分析、简历定制和事实门禁已完成。请核对右侧草稿，确认后选择模板保存。";
    if (requiresAnswer) {
      await clarifyNode.block({
        kind: "missing_info",
        reason: `仍有 ${pendingQuestions.length} 项待澄清${factIssues.length ? `，其中门禁问题 ${factIssues.length} 项` : ""}`,
        recovery: "以结构化选项形式呈现问题，用户作答后只重跑定制与门禁，不重复调研",
      });
    } else {
      await clarifyNode.pass(
        `门禁通过、七个板块均已覆盖，草稿可确认入库（来源 ${(research?.sources || []).length} 个）`
      );
    }

    // ── 阶段五：最终交付 ────────────────────────────────────────────────
    chain.enter("delivery");
    const deliveryNode = await chain.node({
      title: requiresAnswer ? "交付澄清清单，等待补充" : "交付可确认的简历草稿",
      basis: requiresAnswer
        ? "草稿仍有缺口，直接入库会产出不可核验的简历"
        : "所有校验通过，可以交付用户确认",
      action: "写入检查点并下发 user.required 事件，前端据此渲染草稿与澄清卡片",
      expectation: requiresAnswer ? "澄清卡片与缺口提醒" : "可确认的草稿与模板选择入口",
    });
    await saveCheckpoint(job);
    await appendJobEvent(job.id, "user.required", {
      question: job.checkpoint.pendingQuestion,
      factIssues,
      questions: pendingQuestions,
      readyToConfirm: !requiresAnswer,
    });
    await deliveryNode.pass(
      requiresAnswer
        ? `已交付 ${pendingQuestions.length} 个澄清项，等待用户作答`
        : "已交付可确认草稿，等待用户选择模板保存"
    );
  } catch (error) {
    const aborted = signal.aborted;
    const budgetExpired = controller.signal.aborted && controller.signal.reason === "job-budget";
    job.status = budgetExpired ? "failed" : aborted ? "cancelled" : "failed";
    job.error = budgetExpired
      ? `原生简历 Agent 超过 ${Math.round(JOB_BUDGET_MS / 1000)} 秒任务预算，已保存检查点；请恢复任务或缩小本轮调研范围`
      : aborted
        ? "本次简历 Agent 任务已停止"
        : error instanceof Error
          ? error.message
          : String(error);
    // 仍打开的思维链节点必须结算，否则前端留一个永远转圈的节点
    await chain
      .settleOpen({
        kind: budgetExpired ? "budget" : "tool_failure",
        reason: job.error,
        recovery: budgetExpired
          ? "检查点已保存，可恢复任务或缩小调研范围后重试"
          : aborted
            ? "本轮已按用户要求停止，检查点保留"
            : "检查点已保存，修正配置或重试即可从断点继续",
      })
      .catch(() => undefined);
    // 解析失败时把原始响应片段一起记录，否则用户只能看到「没有返回有效的简历 JSON」
    const rawExcerpt = (error as Error & { rawExcerpt?: string })?.rawExcerpt;
    const failureReasoning = (error as Error & { reasoning?: string })?.reasoning;
    if (!aborted && (rawExcerpt || failureReasoning)) {
      await recordModelCall(job, {
        phase: job.phase,
        model: job.input.provider.model,
        status: "error",
        reasoning: failureReasoning,
        rawExcerpt,
        error: job.error,
        startedAt: now(),
        completedAt: now(),
      });
      await appendJobEvent(job.id, "trace.updated", {
        trace: {
          id: crypto.randomUUID(),
          stage: "model-output",
          title: "模型原始输出片段",
          detail: rawExcerpt,
          status: "error",
        },
      });
    }
    job.updatedAt = now();
    job.completedAt = now();
    await saveJob(job);
    await appendJobEvent(job.id, job.status === "cancelled" ? "job.cancelled" : "job.failed", { error: job.error });
  } finally {
    clearTimeout(timeout);
    controllers.delete(jobId);
  }
};

export const createAndRunResumeAgentJob = async (
  request: CreateResumeAgentJobRequest,
  signal?: AbortSignal
) => {
  const createdAt = now();
  const language = request.locale.toLowerCase().startsWith("en") ? "en" : "zh";
  const job: ResumeAgentJob = {
    id: crypto.randomUUID(),
    sessionId: request.sessionId?.trim() || crypto.randomUUID(),
    status: "queued",
    phase: "intake",
    input: {
      locale: request.locale,
      messages: request.messages.slice(-30),
      currentDraft: request.currentDraft || null,
      provider: {
        modelType: request.modelType,
        model: request.model,
        apiEndpoint: request.apiEndpoint,
      },
      exposeReasoning: request.exposeReasoning === true,
    },
    checkpoint: {
      phase: "intake",
      step: 0,
      stateVersion: 3,
      completedSteps: [],
      candidateFacts: [],
      research: null,
      evaluation: null,
      factIssues: [],
      pendingQuestions: [],
      answeredQuestions: [],
      draft: request.currentDraft
        ? normalizeResumeDraft(request.currentDraft, language)
        : createEmptyResumeDraft(language),
      updatedAt: createdAt,
    },
    invocations: [],
    decisions: [],
    modelCalls: [],
    runtime: "native",
    createdAt,
    updatedAt: createdAt,
  };
  await createJob(job);
  await appendJobEvent(job.id, "job.created", { sessionId: job.sessionId, runtime: "native" });
  void executeJob(job.id, {
    modelType: request.modelType,
    apiKey: request.apiKey,
    model: request.model,
    apiEndpoint: request.apiEndpoint,
  }, signal);
  return job;
};

export const cancelResumeAgentJob = async (jobId: string) => {
  const controller = controllers.get(jobId);
  if (controller) controller.abort("user-cancelled");
  const job = await getJob(jobId);
  if (!job) return null;
  if (!controller && ["queued", "running"].includes(job.status)) {
    job.status = "cancelled";
    job.error = "本次简历 Agent 任务已停止";
    job.updatedAt = now();
    job.completedAt = now();
    await saveJob(job);
    await appendJobEvent(job.id, "job.cancelled", { error: job.error });
  }
  return getJob(jobId);
};

export const resumeResumeAgentJob = async (
  jobId: string,
  provider: ResumeAgentProviderPayload,
  messages?: CreateResumeAgentJobRequest["messages"],
  options?: { exposeReasoning?: boolean }
) => {
  const job = await getJob(jobId);
  if (!job) return null;
  if (controllers.has(jobId) || ["queued", "running", "completed"].includes(job.status)) {
    throw new Error("当前 Job 状态不允许恢复");
  }
  normalizeCheckpoint(job);
  if (messages?.length) job.input.messages = messages.slice(-30);
  if (typeof options?.exposeReasoning === "boolean") {
    job.input.exposeReasoning = options.exposeReasoning;
  }
  job.status = "queued";
  job.error = undefined;
  job.completedAt = undefined;
  job.checkpoint.pendingQuestion = undefined;
  job.checkpoint.pendingQuestions = [];
  job.updatedAt = now();
  await saveJob(job);
  void executeJob(job.id, provider);
  return job;
};

/**
 * 多轮续聊：第一轮结束后用户直接在输入框发新消息。
 * 追加消息并回退 candidate_facts / resume_tailoring / fact_gate，让模型基于
 * 新消息重新提取事实并定制；job_research 保持 completed —— 目标未变时跳过
 * 重复调研与重复计费（executeJob 里的目标一致性检测会在目标变化时回退它）。
 * 已作答（含跳过）的澄清项保留在 checkpoint，板块覆盖确认不会重复追问。
 */
export const continueResumeAgentJob = async (
  jobId: string,
  provider: ResumeAgentProviderPayload,
  messages?: CreateResumeAgentJobRequest["messages"],
  options?: { exposeReasoning?: boolean }
) => {
  const job = await getJob(jobId);
  if (!job) return null;
  if (controllers.has(jobId) || ["queued", "running"].includes(job.status)) {
    throw new Error("当前 Job 正在执行，无法继续对话");
  }
  normalizeCheckpoint(job);
  if (messages?.length) job.input.messages = messages.slice(-30);
  if (typeof options?.exposeReasoning === "boolean") {
    job.input.exposeReasoning = options.exposeReasoning;
  }
  job.checkpoint.completedSteps = job.checkpoint.completedSteps.filter(
    (step) => step !== "candidate_facts" && step !== "resume_tailoring" && step !== "fact_gate"
  );
  job.checkpoint.pendingQuestion = undefined;
  job.checkpoint.pendingQuestions = [];
  job.checkpoint.factIssues = [];
  job.checkpoint.discoveredDirections = undefined;
  job.status = "queued";
  job.error = undefined;
  job.completedAt = undefined;
  job.updatedAt = now();
  await saveJob(job);
  await appendJobEvent(job.id, "checkpoint.saved", {
    phase: job.phase,
    step: job.checkpoint.step,
    status: job.status,
    continued: true,
  });
  void executeJob(job.id, provider);
  return job;
};

/**
 * 用户回答澄清问题后重跑：把答案作为一条用户消息追加进对话，
 * 并回退 resume_tailoring / fact_gate 两步，让模型基于新事实重新定制。
 * candidate_facts 与 job_research 保留，避免重复调研与重复付费。
 */
export const answerResumeAgentQuestions = async (
  jobId: string,
  provider: ResumeAgentProviderPayload,
  answerMessage: string,
  answers: NonNullable<ResumeAgentJob["checkpoint"]["answeredQuestions"]>,
  options?: { exposeReasoning?: boolean }
) => {
  const job = await getJob(jobId);
  if (!job) return null;
  if (controllers.has(jobId) || ["queued", "running"].includes(job.status)) {
    throw new Error("当前 Job 正在执行，无法提交回答");
  }
  normalizeCheckpoint(job);
  // 上一次作答因网络等瞬时错误失败时，答案已经写进了 input.messages。
  // 不去重会让同一批回答重复堆进对话，模型上下文里出现多份相同事实。
  const alreadyRecorded = job.input.messages.some(
    (message) => message.role === "user" && message.content === answerMessage
  );
  if (!alreadyRecorded) {
    job.input.messages = [
      ...job.input.messages,
      { id: crypto.randomUUID(), role: "user" as const, content: answerMessage },
    ].slice(-30);
  }
  job.checkpoint.answeredQuestions = [
    ...(job.checkpoint.answeredQuestions || []),
    ...answers,
  ].slice(-60);
  // 必须连 candidate_facts 一起回退：草稿是在该步生成的。
  // 只回退 resume_tailoring 会在「没有岗位调研结果」时死锁——
  // tailoring 要求 research && evaluation，两者为 null 时整步跳过，
  // 草稿保持原样，fact_gate 重新校验同一份草稿，同样的问题再次弹出。
  // job_research 保持 completed，避免重复调研与重复计费。
  job.checkpoint.completedSteps = job.checkpoint.completedSteps.filter(
    (step) =>
      step !== "candidate_facts" && step !== "resume_tailoring" && step !== "fact_gate"
  );
  // pendingQuestions 保留：作答若因瞬时错误失败，用户要能用同一批答案重试，
  // 而 answer 路由需要它来把 questionId 还原成问题原文。执行到 user_confirmation
  // 时会用新一轮的结果整体覆盖，不会残留。
  job.checkpoint.pendingQuestion = undefined;
  job.checkpoint.factIssues = [];
  // 作答是明确的简历操作，跳过 executeJob 的意图分流层
  job.checkpoint.intentSkipped = true;
  if (typeof options?.exposeReasoning === "boolean") {
    job.input.exposeReasoning = options.exposeReasoning;
  }
  job.status = "queued";
  job.error = undefined;
  job.completedAt = undefined;
  job.updatedAt = now();
  await saveJob(job);
  await appendJobEvent(job.id, "checkpoint.saved", {
    phase: job.phase,
    step: job.checkpoint.step,
    status: job.status,
    answeredCount: answers.length,
  });
  void executeJob(job.id, provider);
  return job;
};

/**
 * 用户从阶段一的方向卡片里选定公司后进入阶段二。
 * 只回填 targetJob 并回退 job_research，让精确调研循环拿着真实公司名重跑；
 * candidate_facts 保持 completed —— 草稿事实没变，重跑只会重复计费。
 */
export const selectResumeAgentDirection = async (
  jobId: string,
  provider: ResumeAgentProviderPayload,
  selection: { directionId: string; company: string; title?: string; url?: string },
  options?: { exposeReasoning?: boolean }
) => {
  const job = await getJob(jobId);
  if (!job) return null;
  if (controllers.has(jobId) || ["queued", "running"].includes(job.status)) {
    throw new Error("当前 Job 正在执行，无法选择方向");
  }
  normalizeCheckpoint(job);
  const company = selection.company.trim();
  if (!company) throw new Error("请选择一个具体公司");
  if (!job.checkpoint.draft) throw new Error("Job 尚未生成简历草稿");

  job.checkpoint.draft.targetJob.company = company;
  if (selection.title?.trim()) job.checkpoint.draft.targetJob.title = selection.title.trim();
  // 只接受 https，与 resume_fetch_job_posting 的入口约束一致
  if (selection.url && /^https:\/\//i.test(selection.url)) {
    job.checkpoint.draft.targetJob.jobDescription = [
      job.checkpoint.draft.targetJob.jobDescription,
      selection.url,
    ]
      .filter(Boolean)
      .join("\n");
  }

  const label = [company, selection.title?.trim()].filter(Boolean).join(" · ");
  job.input.messages = [
    ...job.input.messages,
    {
      id: crypto.randomUUID(),
      role: "user" as const,
      content: `我选择这个方向：${label}。请调研它的最新 JD 并据此定制简历。`,
    },
  ].slice(-30);

  // 回退到调研之后的所有步骤：新公司必须重新调研、重新评估、重新定制
  job.checkpoint.completedSteps = job.checkpoint.completedSteps.filter(
    (step) =>
      step !== "job_research" &&
      step !== "jd_analysis" &&
      step !== "career_ops_evaluation" &&
      step !== "resume_tailoring" &&
      step !== "fact_gate"
  );
  // 清空上一轮的调研产物，避免旧公司的岗位证据污染新方向
  job.checkpoint.research = null;
  job.checkpoint.evaluation = null;
  job.checkpoint.discoveredDirections = undefined;
  job.checkpoint.pendingQuestion = undefined;
  // 方向选择是明确的简历操作，跳过 executeJob 的意图分流层
  job.checkpoint.intentSkipped = true;
  if (typeof options?.exposeReasoning === "boolean") {
    job.input.exposeReasoning = options.exposeReasoning;
  }
  job.status = "queued";
  job.error = undefined;
  job.completedAt = undefined;
  job.updatedAt = now();
  await saveJob(job);
  await appendJobEvent(job.id, "checkpoint.saved", {
    phase: job.phase,
    step: job.checkpoint.step,
    status: job.status,
    selectedDirection: selection.directionId,
    company,
  });
  void executeJob(job.id, provider);
  return job;
};
