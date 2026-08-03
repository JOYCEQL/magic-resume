import type {
  CareerOpsEvaluation,
  JobPosting,
  JobResearchBundle,
  ResearchSource,
  ResumeDraft,
} from "@/types/resume-agent";

const SKILL_DICTIONARY = [
  "JavaScript", "TypeScript", "React", "Vue", "Angular", "Node.js",
  "Python", "Java", "Go", "Rust", "C++", "SQL", "Docker", "Kubernetes",
  "AWS", "Azure", "GCP", "Git", "CI/CD", "Playwright", "Jest", "Vitest",
  "LLM", "RAG", "Agent", "Prompt", "NLP", "机器学习", "深度学习",
  "产品设计", "项目管理", "数据分析", "A/B 测试", "微服务", "系统设计",
];

const normalize = (value: string) =>
  value.toLowerCase().replace(/[\s._/+\-]+/g, "");

const unique = <T>(items: T[]) => [...new Set(items)];
const textOfDraft = (draft: ResumeDraft) =>
  [
    draft.summary,
    ...draft.skills,
    ...draft.certifications,
    ...draft.experience.flatMap((item) => [item.company, item.position, ...item.details]),
    ...draft.projects.flatMap((item) => [item.name, item.role, ...item.details]),
    ...draft.education.flatMap((item) => [item.school, item.major, item.degree, ...item.details]),
  ].join("\n");

export const extractAtsKeywords = (description: string) => {
  const normalizedDescription = normalize(description);
  const skills = SKILL_DICTIONARY.filter((skill) =>
    normalizedDescription.includes(normalize(skill))
  );
  const phrases = description
    .split(/[。！？!?;；\n]/)
    .map((item) => item.trim())
    .filter((item) => /负责|要求|经验|能力|熟悉|掌握|优先|responsib|require|experience|proficien|preferred/i.test(item))
    .flatMap((item) => item.match(/[A-Za-z][A-Za-z0-9.+#/-]{1,30}|[\u4e00-\u9fa5]{2,8}/g) || [])
    .filter((item) => item.length > 1 && !/^(负责|要求|经验|能力|熟悉|掌握|优先|工作|岗位|相关)$/.test(item));
  return unique([...skills, ...phrases]).slice(0, 25);
};

export const classifySkillGaps = (draft: ResumeDraft, keywords: string[]) => {
  const resumeText = normalize(textOfDraft(draft));
  const explicitSkills = draft.skills.map(normalize);
  const existing: string[] = [];
  const supportedByResume: string[] = [];
  const gap: string[] = [];
  for (const keyword of unique(keywords)) {
    const token = normalize(keyword);
    if (!token) continue;
    if (explicitSkills.some((skill) => skill.includes(token) || token.includes(skill))) {
      existing.push(keyword);
    } else if (resumeText.includes(token)) {
      supportedByResume.push(keyword);
    } else {
      gap.push(keyword);
    }
  }
  return { existing, supportedByResume, gap };
};

const roleTokens = (title: string) =>
  new Set(
    title
      .toLowerCase()
      .replace(/senior|junior|lead|staff|principal|高级|资深|初级|负责人|专家/g, " ")
      .split(/[^a-z0-9\u4e00-\u9fa5+#.]+/)
      .filter((token) => token.length > 1)
  );

export const roleSimilarity = (left: string, right: string) => {
  const a = roleTokens(left);
  const b = roleTokens(right);
  if (!a.size || !b.size) return 0;
  const intersection = [...a].filter((token) => b.has(token)).length;
  return intersection / new Set([...a, ...b]).size;
};

export const fingerprintText = (input: string) => {
  const tokens = normalize(input).match(/[a-z0-9+#.]{2,}|[\u4e00-\u9fa5]{2}/g) || [];
  const vector = Array.from({ length: 64 }, () => 0);
  for (const token of tokens) {
    let hash = 1469598103934665603n;
    for (const char of token) {
      hash ^= BigInt(char.codePointAt(0) || 0);
      hash = BigInt.asUintN(64, hash * 1099511628211n);
    }
    for (let index = 0; index < 64; index += 1) {
      vector[index] += (hash >> BigInt(index)) & 1n ? 1 : -1;
    }
  }
  let result = 0n;
  vector.forEach((value, index) => {
    if (value >= 0) result |= 1n << BigInt(index);
  });
  return result.toString(16).padStart(16, "0");
};

export const classifyLiveness = (input: {
  status: number;
  requestedUrl?: string;
  finalUrl?: string;
  bodyText: string;
  hasApplyControl?: boolean;
}): JobPosting["status"] => {
  if ([404, 410].includes(input.status)) return "expired";
  if (input.status >= 500 || input.status === 429 || input.status === 403) return "uncertain";
  const text = input.bodyText.toLowerCase();
  if (/job (is )?no longer available|position (has been )?filled|application(s)? closed|职位已关闭|岗位已下线|停止招聘|已结束/.test(text)) return "expired";
  if (/captcha|verify you are human|access denied|cloudflare ray id|人机验证|访问受限/.test(text)) return "uncertain";
  if (input.requestedUrl && input.finalUrl) {
    try {
      const requested = new URL(input.requestedUrl);
      const final = new URL(input.finalUrl);
      if (requested.hostname !== final.hostname || /\/jobs?\/?$/.test(final.pathname)) return "uncertain";
    } catch {
      return "uncertain";
    }
  }
  if (input.hasApplyControl || /apply (now|for this job)|立即申请|投递简历/.test(text)) return "active";
  return text.length >= 500 ? "active" : "uncertain";
};

export const assessSourceTrust = (source: Pick<ResearchSource, "type" | "url" | "publisher">) => {
  let score = source.type === "company_site" || source.type === "ats" ? 85 : source.type === "user" ? 70 : 55;
  const flags: string[] = [];
  if (!source.url) flags.push("缺少可核验链接");
  if (source.url && !source.url.startsWith("https://")) {
    score -= 30;
    flags.push("不是 HTTPS 来源");
  }
  if (source.url && /(greenhouse\.io|lever\.co|ashbyhq\.com|myworkdayjobs\.com)/i.test(source.url)) score += 10;
  if (!source.publisher) flags.push("发布主体不明确");
  return { score: Math.max(0, Math.min(100, score)), flags };
};

/**
 * 已闭环的过程记录，不是待核验的推断。
 *
 * 模型常把「我对用户答复做了什么」写进 assumptions（如"用户已确认目标职位为 X"、
 * "起始年月已由用户补充为 2021 年 9 月"）。这类文本本身就是用户答复的结果，
 * 再反问一次会形成死循环：门禁问 → 用户答 → 模型写一条新的"用户已确认…" → 门禁再问。
 * 实测一个 Job 因此追问 6 轮、用户重复作答 45 次，直到上游余额耗尽。
 *
 * prompt 侧已约束 assumptions 的语义，但模型不可靠，门禁必须独立防御。
 * 两类模式分别对应两种写法（实测那 7 条各占一半，合起来全部命中，
 * 而"根据经历推断…""假设候选人愿意…"这类真推断不会被误杀）：
 */
/** 一、明确引用用户答复作为来源 */
const USER_SETTLED_PATTERN =
  /(用户(已|最新)?(确认|提供|补充|明确表示|指出|说明)|已由用户|按用户(提供|所述|说明)|经用户确认|user (has )?(confirmed|provided|supplied|clarified)|per the user|as (the )?user (confirmed|stated|provided))/i;
/** 二、描述对草稿结构做的增删，含内部字段名或处置动词 */
const DRAFT_MUTATION_PATTERN =
  /(missingSkills|missingFields|assumptions|followUpQuestions|故(从|已|保留|移除)|已(移除|纳入|保留为空)|removed from|kept (it )?(empty|blank))/i;

/** 命中任一模式即视为已闭环，不再作为待确认项反问 */
const isSettledAssumption = (assumption: string) =>
  USER_SETTLED_PATTERN.test(assumption) || DRAFT_MUTATION_PATTERN.test(assumption);

export const validateDraftFacts = (draft: ResumeDraft) => {
  const issues: string[] = [];
  const evidenceFields = new Set(draft.evidence.map((item) => item.field));
  const metrics = [
    ...draft.experience.flatMap((item) => item.details.map((detail) => ({ field: `experience.${item.company}`, detail }))),
    ...draft.projects.flatMap((item) => item.details.map((detail) => ({ field: `projects.${item.name}`, detail }))),
  ].filter(({ detail }) => /\d+(?:\.\d+)?\s*(?:%|倍|万|亿|人|天|小时|ms|秒|元|¥|\$)/i.test(detail));
  for (const metric of metrics) {
    if (![...evidenceFields].some((field) => field.includes(metric.field.split(".")[0]))) {
      issues.push(`量化成果缺少事实证据：${metric.detail.slice(0, 80)}`);
    }
  }
  for (const assumption of draft.assumptions) {
    // 已闭环的过程记录不再反问：它记录的正是用户的答复本身
    if (isSettledAssumption(assumption)) continue;
    issues.push(`待本人确认：${assumption}`);
  }
  for (const conflict of draft.conflicts) issues.push(`事实冲突：${conflict}`);
  return unique(issues);
};

export const buildCareerOpsEvaluation = (
  draft: ResumeDraft,
  research: JobResearchBundle
): CareerOpsEvaluation => {
  const keywords = unique([
    ...research.requiredKeywords,
    ...research.preferredKeywords,
  ]);
  const gaps = classifySkillGaps(draft, keywords);
  const factIssues = validateDraftFacts(draft);
  const supported = unique([...gaps.existing, ...gaps.supportedByResume]);
  const coverage = keywords.length ? supported.length / keywords.length : 0;
  const matchScore = Math.round(Math.min(100, coverage * 75 + (draft.experience.length ? 15 : 0) + (draft.projects.length ? 10 : 0)));
  const recruiterRisks = [
    ...factIssues,
    ...(gaps.gap.length ? [`岗位仍有 ${gaps.gap.length} 项能力缺少候选人证据`] : []),
    ...(!draft.summary ? ["缺少面向目标岗位的职业概述"] : []),
  ];
  const trustScores = research.sources.map((source) => source.trustScore);
  const trustAverage = trustScores.length
    ? trustScores.reduce((total, score) => total + score, 0) / trustScores.length
    : 0;
  return {
    roleSummary: `${research.targetCompany || "目标公司"} · ${research.targetRole || "目标岗位"}`,
    matchScore,
    matchedEvidence: supported,
    supportedSkills: supported,
    skillGaps: gaps.gap,
    recruiterRisks,
    tailoringPlan: [
      "将最相关的真实经历提前，并使用 JD 原词表达已具备能力",
      "对每项岗位要求绑定候选人事实证据，不把技能缺口写成已有能力",
      "优先补充缺少结果、范围或职责边界的经历信息",
    ],
    interviewFocus: gaps.gap.slice(0, 5),
    authenticity: {
      level: trustAverage >= 80 ? "high" : trustAverage >= 60 ? "medium" : trustAverage ? "low" : "unknown",
      flags: research.limitations,
    },
    sixSecondClarity: {
      passed: Boolean(draft.basic.name && draft.targetJob.title && draft.summary && (draft.experience.length || draft.projects.length)),
      issues: [
        ...(!draft.basic.name ? ["姓名不明确"] : []),
        ...(!draft.targetJob.title ? ["目标岗位不明确"] : []),
        ...(!draft.summary ? ["职业概述为空"] : []),
        ...(!draft.experience.length && !draft.projects.length ? ["缺少可快速识别的核心经历"] : []),
      ],
    },
  };
};
