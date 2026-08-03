import type { AIModelType } from "@/config/ai";

export type ResumeAgentConfidence = "high" | "medium" | "low";
export type ResumeAgentMessageRole = "user" | "assistant";
export type ResumeAgentIssueType =
  | "missing"
  | "conflict"
  | "assumption"
  | "low-confidence"
  | "unsupported";
export type ResumeAgentIssueSeverity = "error" | "warning" | "info";
export type ResumeAgentTraceStatus =
  | "pending"
  | "running"
  | "completed"
  | "warning"
  | "error"
  | "cancelled";

export interface ResumeAgentTraceEvent {
  id: string;
  stage: string;
  title: string;
  detail?: string;
  status: ResumeAgentTraceStatus;
  tool?: string;
  sourceCount?: number;
  /**
   * 结构化思维链节点。带此字段的 trace 是决策节点而非叙述文本，
   * 前端按节点渲染（判断依据 / 执行动作 / 产出 / 校验结论）。
   * 可选：旧事件与运行时兼容路径不带该字段，前端回退到 detail 文本渲染。
   */
  chain?: ReasoningNode;
}

/** 思维链的五个阶段，严格按顺序推进 */
export type ReasoningStage =
  | "requirement" // 阶段一：需求拆解与对齐
  | "planning" // 阶段二：任务路径与工具规划
  | "execution" // 阶段三：工具调度与执行
  | "validation" // 阶段四：结果整合与合规校验
  | "delivery"; // 阶段五：最终交付

/** 节点自校验结论；每个节点收尾时必须给出 */
export type ReasoningVerdict =
  | "pass" // 产出符合预期
  | "degraded" // 走了降级方案，产出可用但不完整
  | "blocked" // 卡点，需要外部输入才能继续
  | "skipped" // 依赖不满足或已完成，主动跳过
  | "pending"; // 节点仍在执行，尚未校验

/** 工具调用四要素：调用前写入 reason/inputLogic/expected，调用后补校验结论 */
export interface ReasoningToolCall {
  tool: string;
  /** 调用原因：为什么这一步必须用该工具 */
  reason: string;
  /** 入参构造逻辑：参数来源与合法性依据 */
  inputLogic: string;
  /** 预期返回结果 */
  expected: string;
  /** 入参校验未通过项；为空表示通过 */
  inputIssues?: string[];
  /** 结果可用性校验未通过项；为空表示通过 */
  outputIssues?: string[];
  /** 实际尝试次数（含重试） */
  attempts?: number;
  /** 是否走了降级方案 */
  degraded?: boolean;
}

/** 卡点声明：原因与补全/降级方案缺一不可 */
export interface ReasoningBlocker {
  kind: "missing_info" | "tool_failure" | "ambiguous_requirement" | "budget";
  reason: string;
  /** 补全 / 降级方案 */
  recovery: string;
}

/**
 * 思维链的一个决策节点。basis / action 是硬性要求——
 * 没有判断依据的节点等于流水账，不允许出现。
 */
export interface ReasoningNode {
  id: string;
  stage: ReasoningStage;
  /** 阶段内编号，如 "3.2"，供前端排序与展示 */
  ordinal: string;
  title: string;
  /** 判断依据 */
  basis: string;
  /** 执行动作 */
  action: string;
  /** 预期产出 */
  expectation?: string;
  /** 实际产出 */
  outcome?: string;
  verdict: ReasoningVerdict;
  toolCall?: ReasoningToolCall;
  blocker?: ReasoningBlocker;
  status: ResumeAgentTraceStatus;
  startedAt: string;
  completedAt?: string;
}

export interface ResumeAgentMessage {
  id: string;
  role: ResumeAgentMessageRole;
  content: string;
  createdAt: string;
}

export interface ResumeDraftBasicInfo {
  name: string;
  title: string;
  email: string;
  phone: string;
  location: string;
  employmentStatus: string;
  birthDate: string;
  website: string;
  github: string;
  linkedin: string;
}

export interface ResumeDraftEducation {
  school: string;
  major: string;
  degree: string;
  startDate: string;
  endDate: string;
  gpa: string;
  details: string[];
}

export interface ResumeDraftExperience {
  company: string;
  position: string;
  date: string;
  details: string[];
}

export interface ResumeDraftProject {
  name: string;
  role: string;
  date: string;
  details: string[];
  link: string;
}

export interface ResumeDraftTargetJob {
  title: string;
  company: string;
  jobDescription: string;
  matchedKeywords: string[];
  missingSkills: string[];
}

export interface ResumeDraftEvidence {
  field: string;
  source: string;
  confidence: ResumeAgentConfidence;
}

export interface ResumeDraft {
  version: 1;
  title: string;
  language: "zh" | "en";
  targetJob: ResumeDraftTargetJob;
  basic: ResumeDraftBasicInfo;
  summary: string;
  education: ResumeDraftEducation[];
  experience: ResumeDraftExperience[];
  projects: ResumeDraftProject[];
  skills: string[];
  certifications: string[];
  missingFields: string[];
  assumptions: string[];
  conflicts: string[];
  evidence: ResumeDraftEvidence[];
  followUpQuestions: string[];
}

export interface ResumeAgentValidationIssue {
  id: string;
  type: ResumeAgentIssueType;
  severity: ResumeAgentIssueSeverity;
  field: string;
  message: string;
}

export interface ResumeAgentValidationResult {
  issues: ResumeAgentValidationIssue[];
  errorCount: number;
  warningCount: number;
  canSave: boolean;
}

export interface ResumeAgentProviderPayload {
  modelType: AIModelType;
  apiKey: string;
  model: string;
  apiEndpoint?: string;
}

export type ResumeAgentInputMessage = Pick<
  ResumeAgentMessage,
  "role" | "content"
> & { id?: string };

export interface ResumeAgentRequest extends ResumeAgentProviderPayload {
  locale: string;
  messages: ResumeAgentInputMessage[];
  currentDraft?: ResumeDraft | null;
  sessionId?: string;
  preferRuntime?: boolean;
  /** 显式开启后才采集模型思考过程；默认关闭 */
  exposeReasoning?: boolean;
}

export type ResumeAgentRuntime = "native" | "opencode" | "direct";
/** 输入框消息的意图：纯聊天 vs 简历制作/修改 */
export type ResumeAgentIntent = "chat" | "resume";
export type ResumeAgentJobStatus =
  | "queued"
  | "running"
  | "waiting_user"
  | "completed"
  | "failed"
  | "cancelled";
export type ResumeAgentWorkflowPhase =
  | "intake"
  | "candidate_facts"
  | "target_definition"
  | "job_discovery"
  | "job_research"
  | "jd_analysis"
  | "career_ops_evaluation"
  | "resume_tailoring"
  | "fact_gate"
  | "user_confirmation"
  | "completed";
export type CandidateFactStatus =
  | "confirmed"
  | "inferred"
  | "conflicting"
  | "missing"
  | "rejected";
export type ResumeAgentToolStatus =
  | "pending"
  | "running"
  | "completed"
  | "error"
  | "cancelled";

export type ResumeAgentQuestionKind = "single_choice" | "multi_choice" | "text";

export interface ResumeAgentQuestionOption {
  id: string;
  label: string;
  /** 选中后并入回答文本的语义值 */
  value: string;
}

/** 澄清计划中的一个问题，由工作流从 missingFields / followUpQuestions 结构化而来 */
export interface ResumeAgentPendingQuestion {
  id: string;
  field: string;
  kind: ResumeAgentQuestionKind;
  question: string;
  hint?: string;
  options: ResumeAgentQuestionOption[];
  /** error 表示不回答就无法确认入库 */
  severity: ResumeAgentIssueSeverity;
  /** 是否允许在选项之外补充自由文本 */
  allowFreeText: boolean;
}

export interface ResumeAgentQuestionAnswer {
  questionId: string;
  selectedOptionIds: string[];
  text?: string;
  skipped?: boolean;
}

export interface CandidateFact {
  id: string;
  field: string;
  value: unknown;
  status: CandidateFactStatus;
  confidence: ResumeAgentConfidence;
  sourceMessageIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ResearchSource {
  id: string;
  type: "company_site" | "ats" | "job_board" | "web" | "user";
  title: string;
  url?: string;
  publisher?: string;
  retrievedAt: string;
  trustScore: number;
  excerpt?: string;
}

export interface JobPosting {
  id: string;
  company: string;
  title: string;
  location: string;
  url?: string;
  description: string;
  sourceIds: string[];
  status: "active" | "expired" | "uncertain";
  publishedAt?: string;
  fingerprint?: string;
}

/**
 * 阶段一「方向发现」的一条推荐结果。
 * 用户没提供目标公司时，模型先做广域搜索并给出可选方向，全部字段都必须来自
 * 真实搜索结果——不允许编造公司名或链接。用户选定后才进入阶段二精确调研。
 */
export interface DiscoveredDirection {
  id: string;
  /** 方向名，如「杭州 Java 后端（高并发/微服务）」 */
  title: string;
  /** 为什么与候选人匹配，依据其已有技能与经历 */
  matchReason: string;
  /** 代表公司，来自搜索结果而非模型记忆 */
  companyExamples: string[];
  /** 可点击的公开 JD 链接 */
  sampleUrls: string[];
  /** 支撑该方向的搜索来源条数，供用户判断证据强度 */
  searchSourceCount: number;
}

export interface JobResearchBundle {
  targetCompany: string;
  targetRole: string;
  postings: JobPosting[];
  sources: ResearchSource[];
  commonResponsibilities: string[];
  requiredKeywords: string[];
  preferredKeywords: string[];
  companyInsights: string[];
  limitations: string[];
}

export interface CareerOpsEvaluation {
  roleSummary: string;
  matchScore: number;
  matchedEvidence: string[];
  supportedSkills: string[];
  skillGaps: string[];
  recruiterRisks: string[];
  tailoringPlan: string[];
  interviewFocus: string[];
  authenticity: {
    level: "high" | "medium" | "low" | "unknown";
    flags: string[];
  };
  sixSecondClarity: {
    passed: boolean;
    issues: string[];
  };
}

export interface ResumeAgentToolInvocation {
  id: string;
  tool: string;
  phase: ResumeAgentWorkflowPhase;
  status: ResumeAgentToolStatus;
  inputFingerprint: string;
  inputSummary: string;
  outputSummary?: string;
  error?: string;
  startedAt: string;
  completedAt?: string;
}

export interface ResumeAgentWorkflowCheckpoint {
  phase: ResumeAgentWorkflowPhase;
  step: number;
  stateVersion: 1 | 2 | 3;
  completedSteps: string[];
  candidateFacts: CandidateFact[];
  research: JobResearchBundle | null;
  evaluation: CareerOpsEvaluation | null;
  factIssues: string[];
  draft: ResumeDraft | null;
  pendingQuestion?: string;
  /** v3：结构化澄清计划，供前端渲染 plan mode 选项 */
  pendingQuestions?: ResumeAgentPendingQuestion[];
  /** v3：已作答的澄清项，会回灌进下一轮对话 */
  answeredQuestions?: ResumeAgentQuestionAnswer[];
  /**
   * 明确跳过意图分流的轮次（作答 / 方向选择）。输入框消息（新建 / 续聊）
   * 默认每轮都做意图判断，消费后即重置。
   */
  intentSkipped?: boolean;
  /**
   * 阶段一发现的候选方向。用户未提供目标公司时产出，Job 随即进入 waiting_user
   * 等其选择；选定后清空并进入阶段二精确调研。
   */
  discoveredDirections?: DiscoveredDirection[];
  updatedAt: string;
}

export interface ResumeAgentUserDecision {
  id: string;
  type: "answer" | "confirm_facts" | "confirm_draft" | "reject";
  value: unknown;
  createdAt: string;
}

/** 单次模型调用的可观测记录；reasoning 仅在用户显式开启时才下发 */
export interface ResumeAgentModelCall {
  id: string;
  phase: ResumeAgentWorkflowPhase;
  model: string;
  status: "completed" | "error";
  /** 模型思考过程原文（reasoning_content / <think>）；默认不采集 */
  reasoning?: string;
  /** 结构化输出解析失败时保留原始响应片段，便于诊断 */
  rawExcerpt?: string;
  error?: string;
  startedAt: string;
  completedAt: string;
}

export interface ResumeAgentJobInput {
  locale: string;
  messages: ResumeAgentInputMessage[];
  currentDraft?: ResumeDraft | null;
  provider: Omit<ResumeAgentProviderPayload, "apiKey">;
  /** 用户显式开启后才采集并下发模型思考过程 */
  exposeReasoning?: boolean;
}

export interface ResumeAgentJob {
  id: string;
  sessionId: string;
  status: ResumeAgentJobStatus;
  phase: ResumeAgentWorkflowPhase;
  input: ResumeAgentJobInput;
  checkpoint: ResumeAgentWorkflowCheckpoint;
  invocations: ResumeAgentToolInvocation[];
  decisions: ResumeAgentUserDecision[];
  /** 最近若干次模型调用，用于思维链与失败诊断 */
  modelCalls?: ResumeAgentModelCall[];
  assistantMessage?: string;
  error?: string;
  runtime: ResumeAgentRuntime;
  createdAt: string;
  updatedAt: string;
  startedAt?: string;
  completedAt?: string;
}

export interface CreateResumeAgentJobRequest extends ResumeAgentRequest {
  sessionId?: string;
}

export interface ResumeAgentJobEvent {
  id: string;
  jobId: string;
  sequence: number;
  type:
    | "job.created"
    | "job.started"
    | "phase.changed"
    | "trace.updated"
    | "tool.started"
    | "tool.completed"
    | "tool.failed"
    | "model.reasoning"
    | "checkpoint.saved"
    | "user.required"
    | "job.completed"
    | "job.failed"
    | "job.cancelled";
  createdAt: string;
  payload: Record<string, unknown>;
}

export interface ResumeAgentResponse {
  assistantMessage: string;
  draft: ResumeDraft;
  sessionId?: string;
  runtime: ResumeAgentRuntime;
  trace: ResumeAgentTraceEvent[];
}
