import { useEffect, useMemo, useRef, useState } from "react";
import { Bot, Loader2, RotateCcw, Sparkles, UserRound } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DEFAULT_TEMPLATES } from "@/components/templates/registry";
import type { AIModelType } from "@/config/ai";
import { useTemplateSnapshots } from "@/hooks/useTemplateSnapshots";
import { useLocale, useTranslations } from "@/i18n/compat/client";
import { useRouter } from "@/lib/navigation";
import { useAIConfigStore } from "@/store/useAIConfigStore";
import { useResumeAgentLayoutStore } from "@/store/useResumeAgentLayoutStore";
import { useResumeAgentTimelineStore } from "@/store/useResumeAgentTimelineStore";
import { useResumeStore } from "@/store/useResumeStore";
import type {
  DiscoveredDirection,
  ResumeAgentJob,
  ResumeAgentJobEvent,
  ResumeAgentMessage,
  ResumeAgentPendingQuestion,
  ResumeAgentQuestionAnswer,
  ResumeAgentRuntime,
  ResumeDraft,
} from "@/types/resume-agent";
import type { AgentRunState, AgentTimelineStep } from "@/types/resume-agent-ui";
import { createEmptyResumeDraft, createResumeFromAgentDraft, validateResumeDraft } from "@/utils/resumeAgent";
import { generateUUID } from "@/utils/uuid";
import { AgentComposer } from "./components/AgentComposer";
import { AgentDiscoveryCard, type DirectionSelection } from "./components/AgentDiscoveryCard";
import { AgentGapNotice } from "./components/AgentGapNotice";
import { AgentQuestionCard } from "./components/AgentQuestionCard";
import { AgentSidePanel } from "./components/AgentSidePanel";
import { AgentTraceBlock } from "./components/AgentTraceBlock";
import { AgentWelcome } from "./components/AgentWelcome";

const PROVIDERS: Array<{ id: AIModelType; label: string }> = [
  { id: "doubao", label: "Doubao" },
  { id: "deepseek", label: "DeepSeek" },
  { id: "openai", label: "OpenAI Compatible" },
  { id: "gemini", label: "Gemini" },
  { id: "opencode", label: "OpenCode Zen" },
];

const RESUME_AGENT_STORAGE_KEY = "resume-agent-session-v1";
/**
 * 必须大于服务端 RESUME_AGENT_JOB_BUDGET_MS（默认 420s），否则前端先超时并触发
 * /cancel，把一个本来还能跑完的 Job 掐死。留 60s 余量给轮询与网络往返。
 */
const RESUME_AGENT_TIMEOUT_MS = 480000;
const JOB_POLL_INTERVAL_MS = 800;
/** 会话快照保留的步骤数上限，避免 localStorage 膨胀 */
const PERSISTED_STEP_LIMIT = 60;

export default function ResumeAgentPage() {
  const t = useTranslations("dashboard.resumeAgent");
  const locale = useLocale();
  const router = useRouter();
  const ai = useAIConfigStore();
  const { addResume, setActiveResume } = useResumeStore();
  const language = locale.toLowerCase().startsWith("en") ? "en" : "zh";
  const [provider, setProvider] = useState<AIModelType>(ai.selectedModel);
  const [messages, setMessages] = useState<ResumeAgentMessage[]>([]);
  const [draft, setDraft] = useState<ResumeDraft>(() => createEmptyResumeDraft(language));
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [templateId, setTemplateId] = useState(DEFAULT_TEMPLATES[0]?.id || "classic");
  const [sessionId, setSessionId] = useState<string>();
  const [activeJobId, setActiveJobId] = useState<string>();
  const [runtime, setRuntime] = useState<ResumeAgentRuntime>("native");
  const [runState, setRunState] = useState<AgentRunState>("idle");
  /** 本轮运行的开始时间；运行中由 AgentTraceBlock 内部秒表推算秒数 */
  const [runStartedAt, setRunStartedAt] = useState<number>();
  const [lastSubmittedContent, setLastSubmittedContent] = useState("");
  const [pendingQuestions, setPendingQuestions] = useState<ResumeAgentPendingQuestion[]>([]);
  /** 阶段一发现的候选方向；用户选定后清空并进入阶段二精确调研 */
  const [discoveredDirections, setDiscoveredDirections] = useState<DiscoveredDirection[]>([]);
  const [showReasoning, setShowReasoning] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  /** 缺口提醒条被手动关闭；新一轮运行会重新打开 */
  const [gapNoticeDismissed, setGapNoticeDismissed] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  /** 卸载标记：路由跳走时 abort 触发的 catch 不应再弹 toast / 写 store */
  const mountedRef = useRef(true);
  /** 当前 Job id 的 ref 副本：卸载清理在 effect 之外也需要它 */
  const activeJobIdRef = useRef<string>();
  /** 会话快照的防抖定时器 */
  const persistTimerRef = useRef<number>();
  /** 对话区自动滚动到底部的哨兵 */
  const chatBottomRef = useRef<HTMLDivElement>(null);
  /** 澄清问题卡片引用：提醒条点击滚动到它 */
  const questionCardRef = useRef<HTMLDivElement>(null);
  /** 已消费的事件序号；作答复用同一 Job 时从这里续读，避免重复灌入 */
  const sequenceRef = useRef(0);
  const validation = useMemo(() => validateResumeDraft(draft), [draft]);
  const { snapshotMap } = useTemplateSnapshots(language);

  const steps = useResumeAgentTimelineStore((state) => state.steps);
  const ingestEvents = useResumeAgentTimelineStore((state) => state.ingestEvents);
  const settleRunningSteps = useResumeAgentTimelineStore((state) => state.settleRunning);
  const resetTimeline = useResumeAgentTimelineStore((state) => state.reset);
  const hydrateTimeline = useResumeAgentTimelineStore((state) => state.hydrate);
  const setActiveTab = useResumeAgentLayoutStore((state) => state.setActiveTab);
  const setTraceBlockCollapsed = useResumeAgentLayoutStore((state) => state.setTraceBlockCollapsed);

  const providerConfig = useMemo(() => {
    const map: Record<AIModelType, { apiKey: string; model: string; apiEndpoint?: string }> = {
      doubao: { apiKey: ai.doubaoApiKey, model: ai.doubaoModelId },
      deepseek: { apiKey: ai.deepseekApiKey, model: ai.deepseekModelId || "deepseek-chat" },
      openai: { apiKey: ai.openaiApiKey, model: ai.openaiModelId, apiEndpoint: ai.openaiApiEndpoint },
      gemini: { apiKey: ai.geminiApiKey, model: ai.geminiModelId },
      opencode: { apiKey: ai.opencodeApiKey, model: ai.opencodeModelId },
    };
    return map[provider];
  }, [ai, provider]);

  const providerReady = Boolean(
    providerConfig.apiKey &&
      (provider === "deepseek" || providerConfig.model) &&
      (provider !== "openai" || providerConfig.apiEndpoint)
  );
  const providerLabels = useMemo(
    () => ({
      doubao: `Doubao${ai.doubaoModelId ? ` · ${ai.doubaoModelId}` : ""}`,
      deepseek: `DeepSeek · ${ai.deepseekModelId || "deepseek-chat"}`,
      openai: `OpenAI Compatible${ai.openaiModelId ? ` · ${ai.openaiModelId}` : ""}`,
      gemini: `Gemini${ai.geminiModelId ? ` · ${ai.geminiModelId}` : ""}`,
      opencode: `OpenCode Zen${ai.opencodeModelId ? ` · ${ai.opencodeModelId}` : ""}`,
    }),
    [ai.deepseekModelId, ai.doubaoModelId, ai.geminiModelId, ai.openaiModelId, ai.opencodeModelId]
  );

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(RESUME_AGENT_STORAGE_KEY);
      if (!stored) return;
      const session = JSON.parse(stored) as {
        provider?: AIModelType;
        messages?: ResumeAgentMessage[];
        draft?: ResumeDraft;
        sessionId?: string;
        activeJobId?: string;
        steps?: AgentTimelineStep[];
        runtime?: ResumeAgentRuntime;
        pendingQuestions?: ResumeAgentPendingQuestion[];
        showReasoning?: boolean;
      };
      if (session.provider && PROVIDERS.some((item) => item.id === session.provider)) {
        setProvider(session.provider);
      }
      if (Array.isArray(session.messages)) setMessages(session.messages.slice(-30));
      if (session.draft) setDraft(session.draft);
      if (session.sessionId) setSessionId(session.sessionId);
      if (session.activeJobId) setActiveJobId(session.activeJobId);
      if (Array.isArray(session.steps)) hydrateTimeline(session.steps);
      if (session.runtime) setRuntime(session.runtime);
      if (Array.isArray(session.pendingQuestions)) setPendingQuestions(session.pendingQuestions);
      if (typeof session.showReasoning === "boolean") setShowReasoning(session.showReasoning);
    } catch (error) {
      console.warn("Failed to restore resume agent session:", error);
    }
  }, [hydrateTimeline]);

  // 防抖 1s 落盘：生成中每 800ms 一批事件都会触发依赖变化，
  // 同步 JSON.stringify + setItem 全在主线程，会让打字卡顿。
  useEffect(() => {
    window.clearTimeout(persistTimerRef.current);
    persistTimerRef.current = window.setTimeout(() => {
      try {
        window.localStorage.setItem(
          RESUME_AGENT_STORAGE_KEY,
          JSON.stringify({
            provider,
            messages: messages.slice(-30),
            draft,
            sessionId,
            activeJobId,
            // reasoning 步骤的 detail 单条可达 6000 字符，×60 步会把 localStorage
            // 顶到 5MB 配额上限并让整份会话快照写入失败。思考过程本轮可见即可，
            // 不跨会话保留；服务端 Job 的 modelCalls 仍有完整记录。
            steps: steps
              .filter((step) => step.kind !== "reasoning")
              .slice(-PERSISTED_STEP_LIMIT),
            runtime,
            pendingQuestions,
            showReasoning,
          })
        );
      } catch (error) {
        console.warn("Failed to persist resume agent session:", error);
      }
    }, 1000);
    return () => window.clearTimeout(persistTimerRef.current);
  }, [activeJobId, draft, messages, pendingQuestions, provider, runtime, sessionId, showReasoning, steps]);

  // 秒表下沉到 AgentTraceBlock（useLiveClock），这里不再每秒重渲染整页
  useEffect(() => {
    activeJobIdRef.current = activeJobId;
  }, [activeJobId]);

  // 新消息或澄清请求出现时滚到底部，避免新增内容在视口外看不到
  useEffect(() => {
    if (messages.length === 0 && pendingQuestions.length === 0) return;
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length, pendingQuestions.length]);

  useEffect(
    () => () => {
      // 路由跳走：取消正在跑的 Job，并置卸载标记，让异步 catch 不再弹 toast / 写 store
      mountedRef.current = false;
      const id = activeJobIdRef.current;
      if (id) {
        void fetch(`/api/resume-agent/jobs/${encodeURIComponent(id)}/cancel`, {
          method: "POST",
        }).catch(() => undefined);
      }
      abortControllerRef.current?.abort();
    },
    []
  );

  const stopGeneration = () => {
    if (activeJobId) {
      void fetch(`/api/resume-agent/jobs/${encodeURIComponent(activeJobId)}/cancel`, {
        method: "POST",
      }).catch(() => undefined);
    }
    abortControllerRef.current?.abort();
  };

  const waitForNextPoll = (signal: AbortSignal) =>
    new Promise<void>((resolve, reject) => {
      const timer = window.setTimeout(resolve, JOB_POLL_INTERVAL_MS);
      signal.addEventListener(
        "abort",
        () => {
          window.clearTimeout(timer);
          reject(new DOMException("Resume Agent Job polling cancelled", "AbortError"));
        },
        { once: true }
      );
    });

  /** runtime 徽章仍由 trace stage 决定；步骤本身交给 timeline store */
  const trackRuntime = (events: ResumeAgentJobEvent[]) => {
    for (const event of events) {
      if (event.type !== "trace.updated") continue;
      const stage = (event.payload.trace as { stage?: string } | undefined)?.stage;
      if (stage === "native-runtime") setRuntime("native");
      else if (stage === "runtime") setRuntime("opencode");
      else if (stage === "fallback") setRuntime("direct");
    }
  };

  /** user.required 携带结构化澄清计划；没有则清空，避免残留上一轮问题 */
  const trackPendingQuestions = (events: ResumeAgentJobEvent[]) => {
    for (const event of events) {
      if (event.type !== "user.required") continue;
      const questions = event.payload.questions as ResumeAgentPendingQuestion[] | undefined;
      setPendingQuestions(Array.isArray(questions) ? questions : []);
      // 阶段一的方向事件在同一个 user.required 上携带 directions 载荷
      const directions = event.payload.directions as DiscoveredDirection[] | undefined;
      setDiscoveredDirections(Array.isArray(directions) ? directions : []);
    }
  };

  /**
   * 轮询到 Job 终态为止；submit 与 answer 共用。
   * 从 sequenceRef 续读而非固定 0：作答复用同一个 Job，
   * 若从 0 重读会把上一轮事件再灌一遍，时间线出现重复步骤。
   */
  const pollUntilSettled = async (jobId: string, controller: AbortController) => {
    let sequence = sequenceRef.current;
    let finalJob: ResumeAgentJob | undefined;
    while (!controller.signal.aborted) {
      const [eventsResponse, jobResponse] = await Promise.all([
        fetch(`/api/resume-agent/jobs/${encodeURIComponent(jobId)}/events?after=${sequence}`, {
          signal: controller.signal,
        }),
        fetch(`/api/resume-agent/jobs/${encodeURIComponent(jobId)}`, {
          signal: controller.signal,
        }),
      ]);
      if (!eventsResponse.ok || !jobResponse.ok) throw new Error(t("errors.generateFailed"));
      const eventsData = (await eventsResponse.json()) as { events: ResumeAgentJobEvent[] };
      const jobData = (await jobResponse.json()) as { job: ResumeAgentJob };
      const batch = eventsData.events || [];
      if (batch.length) {
        // 一次 set 批量吃掉整批事件，避免每条事件触发一次重渲染
        ingestEvents(batch);
        trackRuntime(batch);
        trackPendingQuestions(batch);
        sequence = batch.reduce((max, event) => Math.max(max, event.sequence), sequence);
        sequenceRef.current = sequence;
      }
      finalJob = jobData.job;
      if (["completed", "waiting_user", "failed", "cancelled"].includes(finalJob.status)) break;
      await waitForNextPoll(controller.signal);
    }
    return finalJob;
  };

  /** Job 到达终态后的公共收尾：更新草稿、追加助手消息、切换运行状态 */
  const applyFinalJob = (finalJob: ResumeAgentJob) => {
    if (finalJob.status === "failed") throw new Error(finalJob.error || t("errors.generateFailed"));
    if (finalJob.status === "cancelled") {
      throw new DOMException(finalJob.error || "Cancelled", "AbortError");
    }
    if (!finalJob.checkpoint.draft) throw new Error(t("errors.generateFailed"));
    setDraft(finalJob.checkpoint.draft);
    setRuntime(finalJob.runtime);
    const assistantMessage =
      finalJob.assistantMessage ||
      finalJob.checkpoint.pendingQuestion ||
      (language === "en" ? "Draft updated." : "草稿已更新，请核对事实。");
    setMessages((current) => [
      ...current,
      { id: generateUUID(), role: "assistant", content: assistantMessage, createdAt: new Date().toISOString() },
    ]);
    if (finalJob.status === "waiting_user") {
      // 不是完成：Job 在等用户补充信息。轨迹保持展开，让用户知道还有一张表单要填。
      setRunState("waiting_user");
      setTraceBlockCollapsed(false);
      return;
    }
    setPendingQuestions([]);
    setDiscoveredDirections([]);
    setRunState("completed");
    setTraceBlockCollapsed(true);
  };

  /** 把异常翻译成用户可读信息，并同步轨迹与运行状态 */
  const handleRunFailure = (controller: AbortController, error: unknown, jobId?: string) => {
    // 路由跳走后的异步失败：Job 已在卸载清理里取消，这里只静默退出，
    // 否则会在新页面弹一条「已取消」的红色 toast
    if (!mountedRef.current) return;
    const aborted = controller.signal.aborted || (error instanceof DOMException && error.name === "AbortError");
    const timedOut = controller.signal.reason === "timeout";
    if (jobId && aborted) {
      void fetch(`/api/resume-agent/jobs/${encodeURIComponent(jobId)}/cancel`, { method: "POST" }).catch(() => undefined);
    }
    const message = timedOut
      ? t("errors.timeout")
      : aborted
        ? t("errors.cancelled")
        : error instanceof Error
          ? error.message
          : t("errors.generateFailed");
    setRunState(timedOut ? "timeout" : aborted ? "cancelled" : "error");
    settleRunningSteps(
      aborted ? "cancelled" : "error",
      aborted ? t("trace.cancelledStep") : t("trace.stoppedStep"),
      message
    );
    setTraceBlockCollapsed(false);
    toast.error(message);
  };

  const submit = async (retryContent?: string) => {
    const content = (retryContent ?? input).trim();
    if (!content || isSending) return;
    if (!providerReady) {
      toast.error(t("errors.configureProvider"));
      return;
    }
    const isRetry = Boolean(retryContent);
    const nextMessages = isRetry
      ? messages
      : [
          ...messages,
          { id: generateUUID(), role: "user" as const, content, createdAt: new Date().toISOString() },
        ];
    if (!isRetry) setMessages(nextMessages);
    setLastSubmittedContent(content);
    setInput("");
    resetTimeline();
    // 新一轮（或 /resume 重跑）从头读事件；作答走 submitAnswers，不重置
    sequenceRef.current = 0;
    setPendingQuestions([]);
    setDiscoveredDirections([]);
    // 新一轮会产出新的缺口清单，提醒条要重新出现
    setGapNoticeDismissed(false);
    setTraceBlockCollapsed(false);
    setRunState("running");
    setRunStartedAt(Date.now());
    setIsSending(true);
    setRuntime("native");
    const controller = new AbortController();
    abortControllerRef.current = controller;
    const timeoutId = window.setTimeout(() => controller.abort("timeout"), RESUME_AGENT_TIMEOUT_MS);
    let jobId: string | undefined;
    try {
      const resumeExistingJob = isRetry && Boolean(activeJobId);
      const jobResponse = await fetch(
        resumeExistingJob
          ? `/api/resume-agent/jobs/${encodeURIComponent(activeJobId!)}/resume`
          : "/api/resume-agent/jobs",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({
            locale,
            modelType: provider,
            ...providerConfig,
            messages: nextMessages.map(({ id, role, content: messageContent }) => ({ id, role, content: messageContent })),
            currentDraft: draft,
            sessionId,
            exposeReasoning: showReasoning,
          }),
        }
      );
      const created = await jobResponse.json().catch(() => ({}));
      if (!jobResponse.ok || !created.jobId) {
        throw new Error(created?.error || t("errors.generateFailed"));
      }
      jobId = created.jobId as string;
      setActiveJobId(jobId);
      activeJobIdRef.current = jobId;
      if (created.sessionId) setSessionId(created.sessionId);
      const finalJob = await pollUntilSettled(jobId, controller);
      if (!finalJob) throw new Error(t("errors.generateFailed"));
      applyFinalJob(finalJob);
    } catch (error) {
      handleRunFailure(controller, error, jobId);
    } finally {
      window.clearTimeout(timeoutId);
      abortControllerRef.current = null;
      setIsSending(false);
    }
  };

  /**
   * 阶段一 → 阶段二：用户在方向卡片里选定公司，服务端回填 targetJob 并重跑精确调研。
   * 复用同一个 Job 与同一套轮询，进度继续走事件流。
   */
  const selectDirection = async (selection: DirectionSelection) => {
    if (!activeJobId || isSending) return;
    if (!providerReady) {
      toast.error(t("errors.configureProvider"));
      return;
    }
    setTraceBlockCollapsed(false);
    setRunState("running");
    setRunStartedAt(Date.now());
    setIsSending(true);
    const controller = new AbortController();
    abortControllerRef.current = controller;
    const timeoutId = window.setTimeout(() => controller.abort("timeout"), RESUME_AGENT_TIMEOUT_MS);
    try {
      const response = await fetch(
        `/api/resume-agent/jobs/${encodeURIComponent(activeJobId)}/select-direction`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({
            modelType: provider,
            ...providerConfig,
            ...selection,
            exposeReasoning: showReasoning,
          }),
        }
      );
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload?.error || t("errors.generateFailed"));
      // 选定后方向卡片即可收起，后续进度由轨迹与草稿呈现
      setDiscoveredDirections([]);
      const finalJob = await pollUntilSettled(activeJobId, controller);
      if (!finalJob) throw new Error(t("errors.generateFailed"));
      applyFinalJob(finalJob);
    } catch (error) {
      handleRunFailure(controller, error, activeJobId);
    } finally {
      window.clearTimeout(timeoutId);
      abortControllerRef.current = null;
      setIsSending(false);
    }
  };

  /**
   * 提交澄清答案：复用同一个 Job，服务端回退 candidate_facts / tailoring / fact_gate 重跑。
   * 提交期间不卸载表单：答案草稿存在子组件 state，卸载即清空。改成原地禁用、
   * 提交结束后按终态刷新（completed 清空 / 新的 waiting_user 换新问题）。
   */
  const submitAnswers = async (answers: ResumeAgentQuestionAnswer[]) => {
    if (!activeJobId || isSending) return;
    if (!providerReady) {
      toast.error(t("errors.configureProvider"));
      return;
    }
    setGapNoticeDismissed(false);
    setTraceBlockCollapsed(false);
    setRunState("running");
    setRunStartedAt(Date.now());
    setIsSending(true);
    const controller = new AbortController();
    abortControllerRef.current = controller;
    const timeoutId = window.setTimeout(() => controller.abort("timeout"), RESUME_AGENT_TIMEOUT_MS);
    try {
      const response = await fetch(
        `/api/resume-agent/jobs/${encodeURIComponent(activeJobId)}/answer`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({
            modelType: provider,
            ...providerConfig,
            answers,
            exposeReasoning: showReasoning,
          }),
        }
      );
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload?.error || t("errors.generateFailed"));
      const finalJob = await pollUntilSettled(activeJobId, controller);
      if (!finalJob) throw new Error(t("errors.generateFailed"));
      applyFinalJob(finalJob);
    } catch (error) {
      handleRunFailure(controller, error, activeJobId);
      // 失败时不清 pendingQuestions：表单保持挂载，用户填过的答案不会丢
    } finally {
      window.clearTimeout(timeoutId);
      abortControllerRef.current = null;
      setIsSending(false);
    }
  };

  const reset = () => {
    abortControllerRef.current?.abort();
    setMessages([]);
    setDraft(createEmptyResumeDraft(language));
    setInput("");
    setSessionId(undefined);
    setActiveJobId(undefined);
    resetTimeline();
    sequenceRef.current = 0;
    setPendingQuestions([]);
    setDiscoveredDirections([]);
    setGapNoticeDismissed(false);
    setTraceBlockCollapsed(false);
    setRunState("idle");
    setRunStartedAt(undefined);
    setLastSubmittedContent("");
    setRuntime("native");
    window.localStorage.removeItem(RESUME_AGENT_STORAGE_KEY);
  };

  const prefillPrompt = (prompt: string) => {
    setInput(prompt);
    inputRef.current?.focus();
  };

  const saveResume = async () => {
    if (isSaving) return;
    const currentValidation = validateResumeDraft(draft);
    if (!currentValidation.canSave) {
      toast.error(t("errors.resolveErrors"));
      return;
    }
    setIsSaving(true);
    try {
      if (activeJobId) {
        // /confirm 是入库前的服务端硬校验。网络异常时 fetch 会 reject，
        // 原来没有 try/catch，异常直接冒泡，弹窗里没有任何反馈——表现就是「点不动」。
        const confirmation = await fetch(
          `/api/resume-agent/jobs/${encodeURIComponent(activeJobId)}/confirm`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              type: "confirm_draft",
              value: { confirmed: true, templateId },
            }),
          }
        );
        if (!confirmation.ok) {
          const payload = await confirmation.json().catch(() => ({}));
          toast.error(payload?.error || t("errors.generateFailed"));
          return;
        }
      }
      const resume = createResumeFromAgentDraft(draft, templateId);
      const id = addResume(resume);
      setActiveResume(id);
      setTemplateDialogOpen(false);
      toast.success(t("saved"));
      router.push({ to: "/app/workbench/$id", params: { id } });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("errors.generateFailed"));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    // theme-agent-earth 是 scope 到本页的大地棕主题（见 globals.css）：
    // 只覆写 Shadcn 变量，不影响其余 dashboard 页面。
    // lg+ 固定视口高度 + overflow-hidden：顶部标题栏与底部输入框固定，
    // 只有对话消息区内部滚动（不再整页滚）。移动端放开为整页滚动。
    <div className="theme-agent-earth flex max-lg:h-auto max-lg:overflow-visible lg:h-[calc(100dvh-2.75rem)] lg:overflow-hidden flex-col bg-background px-3 pb-6 text-foreground sm:px-6">
      <div className="flex w-full min-h-0 flex-1 flex-col gap-3">
        <header className="flex shrink-0 items-center justify-between gap-3 px-1">
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/10">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h1 className="text-base font-semibold tracking-tight">{t("title")}</h1>
              <p className="text-[11px] text-muted-foreground">{t("subtitle")}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 text-muted-foreground hover:text-foreground"
            onClick={reset}
          >
            <RotateCcw className="h-3.5 w-3.5" />
            {t("reset")}
          </Button>
        </header>

        {/* 断点用 lg（1024）：768–1024 之间对话区会被右侧固定宽面板挤扁，改走堆叠 */}
        <div className="flex min-h-0 w-full flex-1 flex-col gap-3 lg:flex-row">
          {/* 对话栏：lg 下填满行高；消息区内部滚动，输入框固定沉底 */}
          <Card className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-2xl">
            <div className="min-h-0 flex-1 overflow-y-auto">
              <CardContent className="mx-auto w-full max-w-3xl space-y-4 p-5">
                {messages.length === 0 && <AgentWelcome t={t} onPickPrompt={prefillPrompt} />}
                {messages.map((message) => (
                  <div key={message.id} className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                    {message.role === "assistant" && <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary/10"><Bot className="h-4 w-4 text-primary" /></div>}
                    {/* whitespace-pre-wrap：用户粘贴的多行 JD 不能折成一整段；break-words 防超长串撑破气泡 */}
                    <div className={`min-w-0 max-w-[82%] whitespace-pre-wrap break-words rounded-2xl px-4 py-3 text-sm leading-6 ${message.role === "user" ? "bg-primary text-primary-foreground" : "border bg-card"}`}>{message.content}</div>
                    {message.role === "user" && <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-muted"><UserRound className="h-4 w-4" /></div>}
                  </div>
                ))}
                <AgentTraceBlock
                  t={t}
                  runState={runState}
                  isRunning={isSending}
                  startedAt={runStartedAt}
                  runtime={runtime}
                  showReasoning={showReasoning}
                  onToggleReasoning={() => setShowReasoning((current) => !current)}
                  onOpenFullTrace={() => setActiveTab("trace")}
                />
                {/* 阶段一：方向发现卡片（未提供目标公司时自动出现） */}
                {discoveredDirections.length > 0 && (
                  <AgentDiscoveryCard
                    t={t}
                    directions={discoveredDirections}
                    submitting={isSending}
                    onSelect={(selection) => void selectDirection(selection)}
                  />
                )}
                {/* 澄清问题卡片：在对话流底部一题一题弹出 */}
                {pendingQuestions.length > 0 && (
                  <div ref={questionCardRef}>
                    <AgentQuestionCard
                      t={t}
                      questions={pendingQuestions}
                      language={language}
                      submitting={isSending}
                      onSubmit={(answers) => void submitAnswers(answers)}
                    />
                  </div>
                )}
                <div ref={chatBottomRef} />
              </CardContent>
            </div>

            <AgentComposer
              t={t}
              value={input}
              onChange={setInput}
              onSubmit={() => void submit()}
              onStop={stopGeneration}
              onRetry={() => void submit(lastSubmittedContent)}
              isRunning={isSending}
              canRetry={
                (runState === "error" || runState === "timeout" || runState === "cancelled") &&
                !input.trim() &&
                Boolean(lastSubmittedContent)
              }
              provider={provider}
              providers={PROVIDERS.map((item) => ({
                id: item.id,
                label: providerLabels[item.id] || item.label,
              }))}
              onProviderChange={setProvider}
              providerReady={providerReady}
              onOpenProviderSettings={() => router.push("/app/dashboard/ai")}
              timeoutSeconds={Math.floor(RESUME_AGENT_TIMEOUT_MS / 1000)}
              inputRef={inputRef}
              showReasoning={showReasoning}
              onToggleReasoning={() => setShowReasoning((current) => !current)}
            >
              {!gapNoticeDismissed && !isSending && (
                <AgentGapNotice
                  t={t}
                  count={pendingQuestions.length}
                  onOpenQuestions={() =>
                    questionCardRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" })
                  }
                  onDismiss={() => setGapNoticeDismissed(true)}
                />
              )}
            </AgentComposer>
          </Card>

          <AgentSidePanel
            t={t}
            draft={draft}
            validation={validation}
            isRunning={isSending}
            templateId={templateId}
            onTemplateChange={setTemplateId}
            onApprove={() => setTemplateDialogOpen(true)}
            onPrefillPrompt={prefillPrompt}
            onReset={reset}
          />
        </div>
      </div>

      <Dialog open={templateDialogOpen} onOpenChange={setTemplateDialogOpen}>
        {/* Dialog 走 portal 渲染到 body，脱离 .theme-agent-earth 作用域；主题类加在内容上
            让弹窗内外的选中态、按钮配色保持一致 */}
        <DialogContent className="theme-agent-earth max-w-2xl">
          <DialogHeader><DialogTitle>{t("template.title")}</DialogTitle><DialogDescription>{t("template.description")}</DialogDescription></DialogHeader>
          <div className="grid max-h-[55vh] grid-cols-2 gap-3 overflow-y-auto pr-1 sm:grid-cols-3">
            {DEFAULT_TEMPLATES.map((template) => {
              const selected = template.id === templateId;
              const snapshot = snapshotMap[template.id];
              return <button type="button" key={template.id} onClick={() => setTemplateId(template.id)} aria-pressed={selected} className={`overflow-hidden rounded-xl border text-left transition ${selected ? "border-primary bg-primary/5 ring-1 ring-primary" : "hover:border-primary/50"}`}><div className="aspect-[210/297] overflow-hidden border-b bg-muted/20">{snapshot ? <img src={snapshot} alt={`${template.name} ${t("template.previewAlt")}`} className="h-full w-full object-cover object-top" loading="lazy" /> : <div className="grid h-full place-items-center text-xs text-muted-foreground">{t("template.previewUnavailable")}</div>}</div><div className="p-3"><strong className="text-sm">{template.name}</strong><p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{template.description}</p></div></button>;
            })}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTemplateDialogOpen(false)} disabled={isSaving}>
              {t("template.cancel")}
            </Button>
            <Button onClick={() => void saveResume()} disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("template.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
