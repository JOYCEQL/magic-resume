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
import { appendJobEvent, createJob, getJob, saveJob } from "./job-repository";
import { classifyUserIntent, generateResumeDraft } from "./model-adapter";
import { executeNativeTool } from "./tool-registry";
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

/** 工具执行中的标题；完成时把「正在」替换为「已完成」 */
const TOOL_TITLES: Record<string, string> = {
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

const LOOP_STOP_REASONS: Record<string, string> = {
  model_finished: "模型判断证据已足够",
  max_iterations: "达到迭代上限",
  max_tool_calls: "达到工具调用上限",
  budget: "达到时间预算",
  unsupported: "当前模型不支持工具调用",
  error: "调研规划失败",
};

const runTool = async <Input, Output>(
  job: ResumeAgentJob,
  tool: string,
  input: Input,
  signal: AbortSignal
): Promise<Output> => {
  await emitTrace(job, {
    stage: tool,
    title: TOOL_TITLES[tool] || `正在执行 ${tool}`,
    status: "running",
    tool,
  });
  await appendJobEvent(job.id, "tool.started", { tool, phase: job.phase });
  try {
    const result = await executeNativeTool<Input, Output>(tool, input, {
      jobId: job.id,
      phase: job.phase,
      signal,
    });
    job.invocations.push(result.invocation);
    await appendJobEvent(job.id, "tool.completed", { invocation: result.invocation });
    await emitTrace(job, {
      stage: tool,
      title: (TOOL_TITLES[tool] || tool).replace("正在", "已完成"),
      detail: result.invocation.outputSummary,
      status: "completed",
      tool,
    });
    await saveCheckpoint(job);
    return result.output;
  } catch (error) {
    const invocation = (error as Error & { invocation?: ResumeAgentJob["invocations"][number] }).invocation;
    if (invocation) job.invocations.push(invocation);
    await appendJobEvent(job.id, "tool.failed", { tool, error: error instanceof Error ? error.message : String(error) });
    await saveCheckpoint(job);
    throw error;
  }
};

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
        title: TOOL_TITLES[tool] || `正在执行 ${tool}`,
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
          title: (TOOL_TITLES[tool] || tool).replace("正在", "已完成"),
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

/** 确定性调研路径：用户给了 URL、或按公司+职位查 ATS、或直接采用用户粘贴的 JD */
const researchTargetJobDeterministic = async (
  job: ResumeAgentJob,
  draft: ResumeDraft,
  latestInput: string,
  signal: AbortSignal
): Promise<JobResearchBundle | null> => {
  const target = draft.targetJob;
  const urls = findPublicUrls(`${latestInput}\n${target.jobDescription}`);
  if (urls.length) {
    await changePhase(job, "job_discovery");
    const bundles: JobResearchBundle[] = [];
    for (const url of urls) {
      // 单个 URL 失败（重定向/SSRF/网络抖动）不应中断整个调研：跳过继续下一个来源
      try {
        const fetched = await runTool<
          { url: string },
          { source: ResearchSource; text: string; status: "active" | "expired" | "uncertain" }
        >(job, "resume_fetch_job_posting", { url }, signal);
        // 页面不可用（fetch 工具已把重定向/SSRF 标记为 uncertain 空正文）：跳过
        if (!fetched.text.trim() || fetched.status === "uncertain") continue;
        if (job.phase !== "job_research") await changePhase(job, "job_research");
        const bundle = await runTool<
          {
            description: string;
            company: string;
            title: string;
            source: ResearchSource;
            status: "active" | "expired" | "uncertain";
          },
          JobResearchBundle
        >(job, "resume_extract_job_posting", {
          description: fetched.text,
          company: target.company,
          title: target.title,
          source: fetched.source,
          status: fetched.status,
        }, signal);
        bundles.push(bundle);
      } catch {
        // 网络类异常（DNS/超时等）：同样只跳过这一个来源
      }
    }
    // 全部来源都不可用时返回 null：后续步骤干净跳过，不报错
    return bundles.length ? mergeBundles(bundles, target.company, target.title) : null;
  }
  if (target.company.trim() && target.title.trim()) {
    await changePhase(job, "job_discovery");
    const discovered = await runTool<
      { company: string; targetRole: string },
      JobResearchBundle
    >(job, "resume_discover_job_postings", {
      company: target.company.trim(),
      targetRole: target.title.trim(),
    }, signal);
    if (discovered.postings.length) return discovered;
    // ATS 没命中时用通用搜索兜底：把线索页读成正式岗位证据
    const searched = await runTool<
      { company: string; targetRole: string },
      WebSearchOutcome
    >(job, "resume_web_search", {
      company: target.company.trim(),
      targetRole: target.title.trim(),
    }, signal);
    const candidateUrls = searched.results.slice(0, 2).map((item) => item.url);
    if (candidateUrls.length) {
      const bundles: JobResearchBundle[] = [];
      for (const url of candidateUrls) {
        try {
          const fetched = await runTool<
            { url: string },
            { source: ResearchSource; text: string; status: "active" | "expired" | "uncertain" }
          >(job, "resume_fetch_job_posting", { url }, signal);
          if (job.phase !== "job_research") await changePhase(job, "job_research");
          bundles.push(
            await runTool<
              {
                description: string;
                company: string;
                title: string;
                source: ResearchSource;
                status: "active" | "expired" | "uncertain";
              },
              JobResearchBundle
            >(job, "resume_extract_job_posting", {
              description: fetched.text,
              company: target.company,
              title: target.title,
              source: fetched.source,
              status: fetched.status,
            }, signal)
          );
        } catch {
          // 单个搜索结果不可读不应中断调研；limitations 里已有搜索说明
        }
      }
      if (bundles.some((bundle) => bundle.postings.length)) {
        return mergeBundles(bundles, target.company, target.title, searched.sources);
      }
    }
    job.checkpoint.research = {
      ...discovered,
      sources: [...discovered.sources, ...searched.sources],
      limitations: [
        ...discovered.limitations,
        ...(searched.limitation ? [searched.limitation] : []),
      ],
    };
    await saveCheckpoint(job);
  }
  const suppliedDescription = target.jobDescription.trim();
  if (suppliedDescription.length >= 120) {
    if (job.phase !== "job_research") await changePhase(job, "job_research");
    const source: ResearchSource = {
      id: crypto.randomUUID(),
      type: "user",
      title: "用户提供的岗位描述",
      retrievedAt: now(),
      trustScore: 70,
      excerpt: suppliedDescription.slice(0, 500),
    };
    return runTool<
      {
        description: string;
        company: string;
        title: string;
        source: ResearchSource;
        status: "active" | "expired" | "uncertain";
      },
      JobResearchBundle
    >(job, "resume_extract_job_posting", {
      description: suppliedDescription,
      company: target.company,
      title: target.title,
      source,
      status: "uncertain",
    }, signal);
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
        title: TOOL_TITLES[tool] || `正在执行 ${tool}`,
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
          title: (TOOL_TITLES[tool] || tool).replace("正在", "已完成"),
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
  signal: AbortSignal
): Promise<JobResearchBundle | null> => {
  // 用户直接给了 JD URL 时无需规划，确定性路径更快且更可控
  const hasExplicitUrls = findPublicUrls(`${latestInput}\n${draft.targetJob.jobDescription}`).length > 0;
  if (!hasExplicitUrls && supportsAgentLoop(provider.modelType)) {
    try {
      const looped = await researchTargetJobWithLoop(job, draft, provider, latestInput, signal);
      if (looped) return looped;
    } catch (error) {
      if (signal.aborted) throw error;
      await emitTrace(job, {
        stage: "research-loop",
        title: "模型自主调研未完成，已回退到固定调研流程",
        detail: error instanceof Error ? error.message : String(error),
        status: "warning",
      });
    }
  }
  return researchTargetJobDeterministic(job, draft, latestInput, signal);
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

    // ── 意图分流层（intake）────────────────────────────────────────────
    // 输入框消息（新建 / 续聊）每轮先由模型判断意图。纯聊天（问候/闲聊/道谢/
    // 问能力）直接返回一条带引导的回复并进入 waiting_user，不启动工作流、不调
    // 任何工具；识别到简历素材或制作/修改请求才继续。闲聊轮次不标记任何步骤，
    // 所以下一条消息会再次分流，直到真正进入简历流程。作答与方向选择是明确的
    // 简历操作，调用方已设置 intentSkipped 跳过本层。
    const skipIntent = job.checkpoint.intentSkipped === true;
    job.checkpoint.intentSkipped = false;
    if (!skipIntent) {
      await emitTrace(job, {
        stage: "intake",
        title: "正在判断你的意图",
        detail: "闲聊会直接回复；检测到简历素材或制作请求后开始整理",
        status: "running",
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
        await emitTrace(job, {
          stage: "intake",
          title: "意图判断失败，按简历制作继续",
          detail: error instanceof Error ? error.message : String(error),
          status: "warning",
        });
      }
      if (intent === "chat") {
        await emitTrace(job, {
          stage: "intake",
          title: "闲聊：直接回复，不启动工作流",
          detail: "未检测到简历素材，等待你提供基本信息或目标岗位",
          status: "completed",
        });
        const en = job.input.locale.toLowerCase().startsWith("en");
        const reply =
          chatReply ||
          (en
            ? "Hi! I can turn our conversation into a professional resume. Share your basic info and target job (or paste a JD link) and I will start tailoring it for you."
            : "你好！我可以把聊天内容整理成一份专业简历。告诉我你的基本信息和目标岗位（或粘贴 JD 链接），我就开始为你定制。");
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
      await emitTrace(job, {
        stage: "intake",
        title: "识别到简历意图，开始整理",
        detail: "检测到简历素材或制作/修改请求，进入候选人事实提取",
        status: "completed",
      });
    }

    if (!hasCompletedStep(job, "candidate_facts")) {
      await changePhase(job, "candidate_facts");
      const startedAt = now();
      const initial = await generateResumeDraft({
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
          return;
        }
        // 发现失败：如实继续后续流程，limitations 里已有说明
      }

      const researched = await researchTargetJob(
        job,
        job.checkpoint.draft,
        provider,
        latestInput,
        signal
      );
      // researchTargetJobDeterministic 在 ATS 未命中时会把「已尝试但无结果」的
      // bundle 写进 checkpoint.research 再返回 null；直接赋值会把这份说明冲掉，
      // 用户就看不到「为什么没有岗位证据」。
      job.checkpoint.research = researched ?? job.checkpoint.research;
      await completeStep(job, "job_research");
    }

    const research = job.checkpoint.research;
    if (research && !hasCompletedStep(job, "jd_analysis")) {
      await changePhase(job, "jd_analysis");
      await runTool<{ description: string }, string[]>(
        job,
        "resume_extract_ats_keywords",
        { description: research.postings.map((posting) => posting.description).join("\n") },
        signal
      );
      await completeStep(job, "jd_analysis");
    }

    let evaluation = job.checkpoint.evaluation;
    if (research && !hasCompletedStep(job, "career_ops_evaluation")) {
      await changePhase(job, "career_ops_evaluation");
      evaluation = await runTool<
        { draft: ResumeDraft; research: JobResearchBundle },
        CareerOpsEvaluation
      >(job, "resume_analyze_skill_gap", {
        draft: job.checkpoint.draft,
        research,
      }, signal);
      job.checkpoint.evaluation = evaluation;
      await runTool<{ draft: ResumeDraft; research: JobResearchBundle }, string[]>(
        job,
        "resume_rank_evidence",
        { draft: job.checkpoint.draft, research },
        signal
      );
      await runTool<{ evaluation: CareerOpsEvaluation }, string[]>(
        job,
        "resume_build_recruiter_risk_map",
        { evaluation },
        signal
      );
      await completeStep(job, "career_ops_evaluation");
    }

    if (research && evaluation && !hasCompletedStep(job, "resume_tailoring")) {
      await changePhase(job, "resume_tailoring");
      const tailoringStartedAt = now();
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
      job.assistantMessage = tailored.assistantMessage;
      await completeStep(job, "resume_tailoring");
    }

    if (!hasCompletedStep(job, "fact_gate")) {
      await changePhase(job, "fact_gate");
      job.checkpoint.factIssues = await runTool<{ draft: ResumeDraft }, string[]>(
        job,
        "resume_validate_draft_facts",
        { draft: job.checkpoint.draft },
        signal
      );
      await completeStep(job, "fact_gate");
    }
    const factIssues = job.checkpoint.factIssues;
    const language = job.input.locale.toLowerCase().startsWith("en") ? "en" : "zh";
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
    await saveCheckpoint(job);
    await appendJobEvent(job.id, "user.required", {
      question: job.checkpoint.pendingQuestion,
      factIssues,
      questions: pendingQuestions,
      readyToConfirm: !requiresAnswer,
    });
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
