import {
  humanizeFieldKey,
  QUESTION_TOPIC_PATTERNS,
  type ResumeAgentLocale,
} from "@/utils/resumeAgentFieldLabels";
import type {
  ResumeAgentPendingQuestion,
  ResumeAgentQuestionAnswer,
  ResumeDraft,
} from "@/types/resume-agent";

/**
 * 把模型产出的 missingFields / followUpQuestions 结构化成可点选的澄清计划。
 *
 * 放在服务端的原因：前端拿到的只是自由文本清单，无法判断哪些项阻塞入库（error）、
 * 哪些仅待确认（warning）。分类必须与 utils/resumeAgent.ts 的 validateResumeDraft
 * 保持一致，否则会出现「用户答完所有问题仍然不能保存」。
 */

const YES_NO_PATTERN = /^(是否|要不要|需不需要|需要展示|do you want|should (?:i|we)|would you like)/i;
const DATE_PATTERN = /(日期|起止|时间|入职|离职|毕业年份|date|duration)/i;
const COMPANY_PATTERN = /(公司名称|雇主|employer|company name)/i;
const METRIC_PATTERN = /(量化|成果数据|指标|数字|metric|quantif)/i;

const questionIdFor = (field: string, index: number) =>
  `q-${index}-${field.replace(/[^a-zA-Z0-9]+/g, "-").slice(0, 40).toLowerCase()}`;

/**
 * 语义主题从共享文件导入（前端渲染层兜底去重用同一份定义，避免两处漂移）。
 * 模型常把同一件事写两遍——一次进 missingFields（"两段经历的公司名称"），
 * 一次进 followUpQuestions（"请提供两段工作经历的公司名称和起止日期"）。逐字去重
 * 抓不到这种重复，按主题归并；同主题只保留一条，后续命中时用更完整的措辞替换。
 */
const topicsOf = (text: string) =>
  QUESTION_TOPIC_PATTERNS.filter((entry) => entry.pattern.test(text)).map((entry) => entry.topic);

const optionOf = (id: string, label: string, value = label) => ({ id, label, value });

const OPTIONS = {
  zh: {
    yes: optionOf("yes", "需要"),
    no: optionOf("no", "不需要"),
    unknown: optionOf("unknown", "暂时不确定", "暂时不确定，先留空"),
    noMetric: optionOf("no-metric", "没有可核验的数据", "没有可核验的数据，请不要编造"),
    current: optionOf("current", "至今在职"),
  },
  en: {
    yes: optionOf("yes", "Yes"),
    no: optionOf("no", "No"),
    unknown: optionOf("unknown", "Not sure yet", "Not sure yet, leave it blank"),
    noMetric: optionOf("no-metric", "No verifiable data", "No verifiable data; do not invent any"),
    current: optionOf("current", "Still employed"),
  },
} as const;

/** 问题文本决定题型：是非题给二选一，日期/成果题给「不确定」逃逸口，其余为纯文本 */
const classify = (
  text: string,
  language: "zh" | "en"
): Pick<ResumeAgentPendingQuestion, "kind" | "options" | "allowFreeText"> => {
  const options = OPTIONS[language];
  if (YES_NO_PATTERN.test(text)) {
    return {
      kind: "single_choice",
      options: [options.yes, options.no, options.unknown],
      allowFreeText: true,
    };
  }
  if (METRIC_PATTERN.test(text)) {
    return { kind: "text", options: [options.noMetric], allowFreeText: true };
  }
  if (DATE_PATTERN.test(text)) {
    return { kind: "text", options: [options.current, options.unknown], allowFreeText: true };
  }
  if (COMPANY_PATTERN.test(text)) {
    return { kind: "text", options: [options.unknown], allowFreeText: true };
  }
  return { kind: "text", options: [], allowFreeText: true };
};

export const buildPendingQuestions = (
  draft: ResumeDraft,
  factIssues: string[],
  language: ResumeAgentLocale
): ResumeAgentPendingQuestion[] => {
  const zh = language === "zh";
  const seen = new Set<string>();
  const byTopic = new Map<string, number>();
  const questions: ResumeAgentPendingQuestion[] = [];

  const push = (text: string, field: string, severity: ResumeAgentPendingQuestion["severity"]) => {
    const raw = text.trim();
    if (!raw) return;
    // 模型可能在 missingFields 里直接写字段路径（targetJob.company），翻译成人话再入列
    const normalized = humanizeFieldKey(raw, language);
    if (!normalized.trim()) return;
    // 逐字去重：处理完全相同的两条
    const key = normalized.replace(/\s+/g, "").toLowerCase();
    if (seen.has(key)) return;

    // 主题去重：处理"两段经历的公司名称"与"请提供两段工作经历的公司名称和起止日期"
    // 这类同义重复。一句话可能同时命中多个主题（模型写的汇总句常把三件事塞一起），
    // 只要有任一主题已存在就不再新建条目——但把更详细的措辞留作 hint，
    // 因为 followUpQuestions 往往带示例（"例如性能提升幅度、组件复用率"），对填写有用。
    const topics = topicsOf(normalized);
    const hitTopic = topics.find((topic) => byTopic.has(topic));
    if (hitTopic !== undefined) {
      seen.add(key);
      const index = byTopic.get(hitTopic) as number;
      const existing = questions[index];
      if (!existing.hint && normalized.length > existing.question.length) {
        questions[index] = { ...existing, hint: normalized };
      }
      return;
    }

    seen.add(key);
    for (const topic of topics) byTopic.set(topic, questions.length);
    questions.push({
      id: questionIdFor(field, questions.length),
      field,
      question: normalized,
      severity,
      ...classify(normalized, language),
    });
  };

  // 阻塞项优先：这些不回答就过不了 /confirm 硬校验
  if (!draft.basic.name) {
    push(zh ? "请提供简历上使用的姓名" : "What name should the resume use?", "basic.name", "error");
  }
  if (!draft.basic.email && !draft.basic.phone) {
    push(
      zh ? "请提供邮箱或电话中的至少一项" : "Provide at least an email or a phone number",
      "basic.contact",
      "error"
    );
  }
  for (const conflict of draft.conflicts) {
    push(
      zh ? `以下事实存在冲突，请确认正确版本：${conflict}` : `Resolve this conflicting fact: ${conflict}`,
      "draft.conflict",
      "error"
    );
  }

  // 先收 missingFields / followUpQuestions：它们逐项聚焦，作为各主题的首条。
  // factIssues 是模型写的汇总句（一条里塞进公司名+日期+量化数据三件事），
  // 若先入会抢占 company 主题并把独立的公司名问题挤掉，所以放到最后收尾。
  for (const field of draft.missingFields) push(field, "draft.missing", "warning");
  for (const question of draft.followUpQuestions) push(question, "draft.followUp", "warning");
  for (const issue of factIssues) push(issue, "fact.gate", "warning");

  return questions.slice(0, 12);
};

/** 把选择与补充文本拼成一条可回灌进对话的用户消息 */
export const formatAnswersAsMessage = (
  questions: ResumeAgentPendingQuestion[],
  answers: ResumeAgentQuestionAnswer[],
  language: "zh" | "en"
) => {
  const zh = language === "zh";
  const byId = new Map(questions.map((question) => [question.id, question]));
  const lines: string[] = [];
  for (const answer of answers) {
    const question = byId.get(answer.questionId);
    if (!question) continue;
    if (answer.skipped) {
      lines.push(
        `${question.question} → ${
          zh
            ? "暂不提供，请勿编造，保留为待补充项"
            : "Not provided; do not invent it, keep it as missing"
        }`
      );
      continue;
    }
    const selected = question.options
      .filter((option) => answer.selectedOptionIds.includes(option.id))
      .map((option) => option.value);
    const parts = [...selected, answer.text?.trim()].filter(Boolean);
    if (!parts.length) continue;
    lines.push(`${question.question} → ${parts.join("；")}`);
  }
  if (!lines.length) return "";
  const header = zh
    ? "以下是我对待补充项的回答，请只依据这些事实更新草稿，不要推断未提供的内容："
    : "Here are my answers to the outstanding items. Update the draft using only these facts and do not infer anything else:";
  return `${header}\n${lines.join("\n")}`;
};
