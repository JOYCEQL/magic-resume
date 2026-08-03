import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Send,
  SkipForward,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { Translator } from "@/i18n/compat/utils";
import {
  dedupeQuestions,
  type ResumeAgentLocale,
} from "@/utils/resumeAgentFieldLabels";
import type {
  ResumeAgentPendingQuestion,
  ResumeAgentQuestionAnswer,
} from "@/types/resume-agent";

interface DraftAnswer {
  selectedOptionIds: string[];
  text: string;
  skipped: boolean;
}

const emptyAnswer = (): DraftAnswer => ({ selectedOptionIds: [], text: "", skipped: false });

const hasContent = (answer?: DraftAnswer) =>
  Boolean(
    answer && (answer.skipped || answer.selectedOptionIds.length > 0 || answer.text.trim().length > 0)
  );

interface AgentQuestionCardProps {
  t: Translator;
  questions: ResumeAgentPendingQuestion[];
  language: ResumeAgentLocale;
  /** 提交重跑中：控件原地禁用，保住已填答案 */
  submitting: boolean;
  onSubmit: (answers: ResumeAgentQuestionAnswer[]) => void;
}

/**
 * 对话流里的 plan-mode 澄清卡片：一题一题回答（参考 opencode 的提问块）。
 * 「当前题」由显式游标 stepIndex 决定，不再由「谁还没答」自动推导——
 * 输入 / 点选项都不会自动跳题，只有按「下一题」确认后才推进；
 * 「上一题」和可点击的已答摘要提供回改入口，已填内容全程保留。
 * 渲染前先过 dedupeQuestions：把字段路径翻译成人话，并兜底去重保证题目独立。
 */
export const AgentQuestionCard = ({
  t,
  questions,
  language,
  submitting,
  onSubmit,
}: AgentQuestionCardProps) => {
  const [answers, setAnswers] = useState<Record<string, DraftAnswer>>({});
  const [stepIndex, setStepIndex] = useState(0);
  const currentRef = useRef<HTMLDivElement>(null);
  const firstRender = useRef(true);

  // 渲染前兜底：翻译字段路径 + 去重（不依赖服务端，历史数据也会被清理）
  const list = useMemo(() => dedupeQuestions(questions, language), [questions, language]);

  const update = (id: string, patch: Partial<DraftAnswer>) =>
    setAnswers((current) => ({ ...current, [id]: { ...(current[id] || emptyAnswer()), ...patch } }));

  const toggleOption = (question: ResumeAgentPendingQuestion, optionId: string) => {
    const draft = answers[question.id] || emptyAnswer();
    const selected = draft.selectedOptionIds.includes(optionId)
      ? draft.selectedOptionIds.filter((id) => id !== optionId)
      : question.kind === "multi_choice"
        ? [...draft.selectedOptionIds, optionId]
        : [optionId];
    update(question.id, { selectedOptionIds: selected, skipped: false });
  };

  const answeredCount = useMemo(
    () => list.filter((question) => hasContent(answers[question.id])).length,
    [answers, list]
  );
  /** 尚未作答的必填项（error 级）：不答完无法确认入库 */
  const blockingRemaining = useMemo(
    () =>
      list.filter(
        (question) => question.severity === "error" && !hasContent(answers[question.id])
      ).length,
    [answers, list]
  );

  // 游标越界保护：题单变化后（去重/换批）把指针钳回有效范围
  const safeIndex = Math.min(stepIndex, list.length - 1);
  const current = list[safeIndex];
  const isLast = safeIndex === list.length - 1;
  const currentDraft = current ? answers[current.id] || emptyAnswer() : emptyAnswer();
  const currentHasContent = current ? hasContent(currentDraft) : false;

  // 换了一批问题（新一轮 user.required）时清空旧答案并回到第 1 题
  const questionKey = list.map((q) => q.id).join("|");
  useEffect(() => {
    setAnswers({});
    setStepIndex(0);
  }, [questionKey]);

  // 切题时把当前题滚进视口；首渲染不滚，避免抢滚动
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    currentRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [current?.id]);

  if (!list.length) return null;

  const submit = () => {
    const payload: ResumeAgentQuestionAnswer[] = list
      .filter((question) => hasContent(answers[question.id]))
      .map((question) => {
        const draft = answers[question.id] || emptyAnswer();
        return {
          questionId: question.id,
          selectedOptionIds: draft.selectedOptionIds,
          text: draft.text.trim() || undefined,
          skipped: draft.skipped,
        };
      });
    if (payload.length) onSubmit(payload);
  };

  const goPrevious = () => setStepIndex((index) => Math.max(0, index - 1));
  const goNext = () => {
    if (isLast) {
      submit();
    } else {
      setStepIndex((index) => Math.min(list.length - 1, index + 1));
    }
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-primary/25 bg-primary/[0.03]">
      <div className="flex flex-wrap items-center gap-2 border-b border-primary/15 px-4 py-3">
        <span className="text-sm font-medium">{t("clarify.title")}</span>
        <Badge variant="outline" className="h-5 px-1.5 text-[10px] font-normal">
          {t("clarify.step", {
            current: Math.min(safeIndex + 1, list.length),
            total: list.length,
          })}
        </Badge>
        <Badge variant="secondary" className="h-5 px-1.5 text-[10px] font-normal">
          {t("clarify.progress", { answered: answeredCount, total: list.length })}
        </Badge>
        {blockingRemaining > 0 && (
          <Badge variant="destructive" className="h-5 px-1.5 text-[10px] font-normal">
            {t("clarify.blocking", { count: blockingRemaining })}
          </Badge>
        )}
      </div>

      <div className="space-y-2 p-4">
        {/* 已答问题：折叠成一行摘要，点击可跳回该题修改 */}
        {list.map((question, index) => {
          const draft = answers[question.id];
          if (!hasContent(draft)) return null;
          return (
            <button
              key={question.id}
              type="button"
              onClick={() => setStepIndex(index)}
              disabled={submitting}
              title={t("clarify.edit")}
              className="flex w-full items-start gap-2 rounded-lg bg-muted/20 px-3 py-2 text-left transition hover:bg-muted/40"
            >
              {draft.skipped ? (
                <SkipForward className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              ) : (
                <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-500" />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs text-muted-foreground">{question.question}</p>
                {!draft.skipped && (draft.text.trim() || draft.selectedOptionIds.length > 0) && (
                  <p className="mt-0.5 truncate text-[11px] text-foreground/70">
                    {draft.text.trim() || draft.selectedOptionIds.join("、")}
                  </p>
                )}
              </div>
            </button>
          );
        })}

        {/* 当前题：完整交互 */}
        {current && (
          <div ref={currentRef} className="rounded-xl border bg-background p-3.5">
            <div className="flex items-start gap-2">
              {current.severity === "error" && (
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
              )}
              <div className="min-w-0 flex-1">
                <p className="break-words text-sm leading-6">{current.question}</p>
                {current.hint && (
                  <p className="mt-1 break-words text-[11px] leading-4 text-muted-foreground">
                    {current.hint}
                  </p>
                )}
              </div>
            </div>

            {current.options.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {current.options.map((option) => {
                  const draft = answers[current.id] || emptyAnswer();
                  const selected = draft.selectedOptionIds.includes(option.id);
                  return (
                    <Button
                      key={option.id}
                      type="button"
                      variant={selected ? "default" : "outline"}
                      size="sm"
                      className="h-7 px-2 text-[11px] font-normal"
                      onClick={() => toggleOption(current, option.id)}
                      disabled={submitting}
                    >
                      {option.label}
                    </Button>
                  );
                })}
              </div>
            )}

            {current.allowFreeText && (
              <Textarea
                value={currentDraft.text}
                onChange={(event) => update(current.id, { text: event.target.value, skipped: false })}
                placeholder={t("clarify.inputPlaceholder")}
                disabled={submitting}
                rows={1}
                className="mt-3 min-h-[2.25rem] resize-none py-1.5 text-xs"
              />
            )}

            {/* 导航：上一题 / 暂不提供 / 下一题（末题变提交并继续） */}
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 gap-1 px-2 text-[11px] font-normal"
                onClick={goPrevious}
                disabled={submitting || safeIndex === 0}
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                {t("clarify.previous")}
              </Button>
              <div className="flex items-center gap-1.5">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className={
                    currentDraft.skipped
                      ? "h-7 gap-1 px-2 text-[11px] text-primary"
                      : "h-7 gap-1 px-2 text-[11px] text-muted-foreground"
                  }
                  onClick={() =>
                    update(current.id, {
                      skipped: !currentDraft.skipped,
                      selectedOptionIds: [],
                      text: "",
                    })
                  }
                  disabled={submitting}
                >
                  <SkipForward className="h-3 w-3" />
                  {currentDraft.skipped ? t("clarify.skipped") : t("clarify.skip")}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  className="h-7 gap-1 px-2 text-[11px]"
                  onClick={goNext}
                  // 「下一题」只要求当前题已答；「提交」额外要求必填项全部就绪
                  disabled={
                    submitting || !currentHasContent || (isLast && blockingRemaining > 0)
                  }
                >
                  {isLast ? (
                    <>
                      {submitting ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Send className="h-3 w-3" />
                      )}
                      {t("clarify.submit")}
                    </>
                  ) : (
                    <>
                      {t("clarify.next")}
                      <ChevronRight className="h-3.5 w-3.5" />
                    </>
                  )}
                </Button>
              </div>
            </div>

            {isLast && (
              <p className="mt-2 text-[11px] leading-4 text-muted-foreground">
                {t("clarify.submitHint")}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
