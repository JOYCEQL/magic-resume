import { createHash } from "node:crypto";
import type {
  JobResearchBundle,
  ResearchSource,
  ResumeAgentToolInvocation,
  ResumeAgentWorkflowPhase,
  ResumeDraft,
} from "@/types/resume-agent";
import {
  assessSourceTrust,
  buildCareerOpsEvaluation,
  classifyLiveness,
  extractAtsKeywords,
  fingerprintText,
  validateDraftFacts,
} from "./career-ops";
import { discoverPublicAtsJobs } from "./ats-providers";
import { fetchPublicText, htmlToText } from "./security";
import { searchWeb, type WebSearchOutcome } from "./web-search";

export interface NativeToolContext {
  jobId: string;
  phase: ResumeAgentWorkflowPhase;
  signal: AbortSignal;
}

export interface NativeToolDefinition<Input, Output> {
  name: string;
  description: string;
  phases: ResumeAgentWorkflowPhase[];
  execute: (input: Input, context: NativeToolContext) => Promise<Output>;
  summarizeInput: (input: Input) => string;
  summarizeOutput: (output: Output) => string;
}

const registry = new Map<string, NativeToolDefinition<unknown, unknown>>();

const register = <Input, Output>(definition: NativeToolDefinition<Input, Output>) => {
  registry.set(definition.name, definition as NativeToolDefinition<unknown, unknown>);
};

register<{ company: string; targetRole: string }, JobResearchBundle>({
  name: "resume_discover_job_postings",
  description: "从受控公共 ATS 来源主动发现目标公司岗位",
  phases: ["job_discovery"],
  summarizeInput: (input) => `${input.company} · ${input.targetRole}`,
  summarizeOutput: (output) => `发现 ${output.postings.length} 个去重岗位，${output.sources.length} 个招聘来源`,
  execute: async ({ company, targetRole }, context) => {
    const discovered = await discoverPublicAtsJobs(company, targetRole, context.signal);
    const description = discovered.postings.map((posting) => posting.description).join("\n");
    const keywords = extractAtsKeywords(description);
    return {
      targetCompany: company,
      targetRole,
      postings: discovered.postings,
      sources: discovered.sources,
      commonResponsibilities: description
        .split(/[。；;\n]/)
        .map((item) => item.trim())
        .filter((item) => /负责|职责|responsib/i.test(item))
        .slice(0, 15),
      requiredKeywords: keywords.slice(0, 18),
      preferredKeywords: keywords.slice(18, 25),
      companyInsights: [],
      limitations: discovered.postings.length
        ? []
        : [`已尝试 ${discovered.attempted.join("、")} 公共招聘源，但未发现与目标职位相近的公开岗位`],
    };
  },
});

register<{ url: string }, { source: ResearchSource; text: string; status: "active" | "expired" | "uncertain" }>({
  name: "resume_fetch_job_posting",
  description: "安全读取公开 HTTPS 岗位页面并执行存活检查",
  phases: ["job_discovery", "job_research"],
  summarizeInput: (input) => input.url,
  summarizeOutput: (output) => `读取 ${output.text.length} 字，岗位状态：${output.status}`,
  execute: async ({ url }, context) => {
    let response: Response;
    let html: string;
    let finalUrl: string;
    try {
      const fetched = await fetchPublicText(url, context.signal);
      response = fetched.response;
      html = fetched.text;
      finalUrl = fetched.finalUrl;
    } catch (error) {
      // 页面不可用（重定向 / SSRF 拦截 / 内容类型不支持 / 内容过大）→ 可恢复结果，
      // 不终止整个 Job。安全红线不放开：仍不跟随重定向，只把「单个来源不可用」
      // 如实标记为 uncertain，让调研循环换别的来源继续。
      const message = error instanceof Error ? error.message : String(error);
      const hostname = new URL(url).hostname;
      return {
        source: {
          id: crypto.randomUUID(),
          type: "web",
          title: `岗位页面：${hostname}`,
          url,
          publisher: hostname,
          retrievedAt: new Date().toISOString(),
          trustScore: 0,
          excerpt: message.slice(0, 500),
        },
        text: "",
        status: "uncertain" as const,
      };
    }
    const text = htmlToText(html).slice(0, 60_000);
    const status = classifyLiveness({
      status: response.status,
      requestedUrl: url,
      finalUrl,
      bodyText: text,
      hasApplyControl: /apply|申请|投递/i.test(html),
    });
    const trust = assessSourceTrust({ type: "web", url: finalUrl, publisher: new URL(finalUrl).hostname });
    return {
      source: {
        id: crypto.randomUUID(),
        type: /(greenhouse\.io|lever\.co|ashbyhq\.com|myworkdayjobs\.com)/i.test(finalUrl) ? "ats" : "web",
        title: `岗位页面：${new URL(finalUrl).hostname}`,
        url: finalUrl,
        publisher: new URL(finalUrl).hostname,
        retrievedAt: new Date().toISOString(),
        trustScore: trust.score,
        excerpt: text.slice(0, 500),
      },
      text,
      status,
    };
  },
});

register<{ description: string; company: string; title: string; source: ResearchSource; status?: "active" | "expired" | "uncertain" }, JobResearchBundle>({
  name: "resume_extract_job_posting",
  description: "从岗位正文提取结构化岗位研究包",
  phases: ["job_research", "jd_analysis"],
  summarizeInput: (input) => `${input.company || "目标公司"} · ${input.title || "目标岗位"}`,
  summarizeOutput: (output) => `提取 ${output.requiredKeywords.length} 个岗位关键词`,
  execute: async (input) => {
    const keywords = extractAtsKeywords(input.description);
    const source = input.source;
    return {
      targetCompany: input.company,
      targetRole: input.title,
      postings: [{
        id: crypto.randomUUID(),
        company: input.company,
        title: input.title,
        location: "",
        url: source.url,
        description: input.description,
        sourceIds: [source.id],
        status: input.status || "uncertain",
        fingerprint: fingerprintText(input.description),
      }],
      sources: [source],
      commonResponsibilities: input.description
        .split(/[。；;\n]/)
        .map((item) => item.trim())
        .filter((item) => /负责|职责|responsib/i.test(item))
        .slice(0, 10),
      requiredKeywords: keywords.slice(0, 18),
      preferredKeywords: keywords.slice(18, 25),
      companyInsights: [],
      limitations: source.type === "user" ? ["岗位信息来自用户粘贴，尚未通过公开来源交叉验证"] : [],
    };
  },
});

register<{ description: string }, string[]>({
  name: "resume_extract_ats_keywords",
  description: "确定性提取 ATS 关键词",
  phases: ["jd_analysis"],
  summarizeInput: (input) => `${input.description.length} 字岗位描述`,
  summarizeOutput: (output) => `${output.length} 个关键词`,
  execute: async ({ description }) => extractAtsKeywords(description),
});

register<{ draft: ResumeDraft; research: JobResearchBundle }, ReturnType<typeof buildCareerOpsEvaluation>>({
  name: "resume_analyze_skill_gap",
  description: "按候选人证据分析技能匹配和缺口",
  phases: ["career_ops_evaluation"],
  summarizeInput: (input) => `${input.research.requiredKeywords.length} 个岗位要求`,
  summarizeOutput: (output) => `匹配度 ${output.matchScore}，缺口 ${output.skillGaps.length} 项`,
  execute: async ({ draft, research }) => buildCareerOpsEvaluation(draft, research),
});

register<{ draft: ResumeDraft; research: JobResearchBundle }, string[]>({
  name: "resume_rank_evidence",
  description: "按岗位关键词对真实经历证据排序",
  phases: ["career_ops_evaluation", "resume_tailoring"],
  summarizeInput: (input) => `${input.draft.experience.length + input.draft.projects.length} 段候选人经历`,
  summarizeOutput: (output) => `${output.length} 条相关证据`,
  execute: async ({ draft, research }) => {
    const keywords = research.requiredKeywords.map((keyword) => keyword.toLowerCase());
    return [
      ...draft.experience.flatMap((item) => item.details.map((detail) => `${item.company}｜${item.position}：${detail}`)),
      ...draft.projects.flatMap((item) => item.details.map((detail) => `${item.name}｜${item.role}：${detail}`)),
    ]
      .map((evidence) => ({ evidence, score: keywords.filter((keyword) => evidence.toLowerCase().includes(keyword)).length }))
      .filter((item) => item.score > 0)
      .sort((left, right) => right.score - left.score)
      .map((item) => item.evidence)
      .slice(0, 20);
  },
});

register<{ evaluation: ReturnType<typeof buildCareerOpsEvaluation> }, string[]>({
  name: "resume_build_recruiter_risk_map",
  description: "从招聘者视角汇总风险与证明材料缺口",
  phases: ["career_ops_evaluation", "fact_gate"],
  summarizeInput: (input) => `当前匹配度 ${input.evaluation.matchScore}`,
  summarizeOutput: (output) => `${output.length} 项招聘者风险`,
  execute: async ({ evaluation }) => evaluation.recruiterRisks,
});

register<
  {
    /** 阶段一按技能广域搜索时没有公司，故为可选 */
    company?: string;
    targetRole: string;
    extraKeywords?: string[];
    /** recent 把结果限定在近一个月，用于「JD 必须最新」的精确调研 */
    freshness?: "recent" | "any";
  },
  WebSearchOutcome
>({
  name: "resume_web_search",
  description: "通用 Web 搜索，补齐 ATS 接口未覆盖的公司官网招聘页与岗位线索",
  phases: ["job_discovery", "job_research"],
  summarizeInput: (input) =>
    [input.company || "（未指定公司）", input.targetRole].filter(Boolean).join(" · "),
  summarizeOutput: (output) =>
    output.configured
      ? `搜索到 ${output.results.length} 条候选来源${output.limitation ? `（${output.limitation}）` : ""}`
      : "未配置搜索服务，已跳过",
  execute: async ({ company, targetRole, extraKeywords, freshness }, context) => {
    const query = [company, targetRole, ...(extraKeywords || []), "招聘 careers job"]
      .filter(Boolean)
      .join(" ");
    return searchWeb(query, context.signal, freshness === "recent" ? "month" : undefined);
  },
});

register<{ draft: ResumeDraft }, string[]>({
  name: "resume_validate_draft_facts",
  description: "执行数字、日期、能力和推断事实门禁",
  phases: ["fact_gate"],
  summarizeInput: (input) => `${input.draft.experience.length + input.draft.projects.length} 段经历`,
  summarizeOutput: (output) => output.length ? `${output.length} 项待核验事实` : "事实门禁通过",
  execute: async ({ draft }) => validateDraftFacts(draft),
});

export const fingerprintToolInput = (tool: string, input: unknown) =>
  createHash("sha256").update(`${tool}:${JSON.stringify(input)}`).digest("hex");

export const executeNativeTool = async <Input, Output>(
  tool: string,
  input: Input,
  context: NativeToolContext
): Promise<{ output: Output; invocation: ResumeAgentToolInvocation }> => {
  const definition = registry.get(tool);
  if (!definition) throw new Error(`未注册的简历领域工具：${tool}`);
  if (!definition.phases.includes(context.phase)) throw new Error(`工具 ${tool} 不允许在 ${context.phase} 阶段执行`);
  const startedAt = new Date().toISOString();
  const invocation: ResumeAgentToolInvocation = {
    id: crypto.randomUUID(),
    tool,
    phase: context.phase,
    status: "running",
    inputFingerprint: fingerprintToolInput(tool, input),
    inputSummary: definition.summarizeInput(input),
    startedAt,
  };
  try {
    const output = await definition.execute(input, context) as Output;
    return {
      output,
      invocation: {
        ...invocation,
        status: "completed",
        outputSummary: definition.summarizeOutput(output),
        completedAt: new Date().toISOString(),
      },
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw Object.assign(new Error(message), {
      invocation: {
        ...invocation,
        status: context.signal.aborted ? "cancelled" : "error",
        error: message,
        completedAt: new Date().toISOString(),
      } satisfies ResumeAgentToolInvocation,
    });
  }
};

export const listNativeTools = () =>
  [...registry.values()].map(({ name, description, phases }) => ({ name, description, phases }));
