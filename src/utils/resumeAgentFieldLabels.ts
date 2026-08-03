import type { ResumeAgentPendingQuestion } from "@/types/resume-agent";

export type ResumeAgentLocale = "zh" | "en";

/**
 * 模型产出 missingFields 时可能直接写字段路径（targetJob.company、experience[0].company），
 * 服务端此前原样当问题文本下发，界面就出现英文字段名。这里统一做「字段路径 → 可读问题」翻译。
 * 服务端（clarification.ts）与前端（AgentQuestionCard）共用同一份标签，避免两处漂移。
 */

const FIELD_LABELS: Record<string, { zh: string; en: string }> = {
  "basic.name": { zh: "姓名", en: "your name" },
  "basic.title": { zh: "目标职位", en: "target job title" },
  "basic.email": { zh: "邮箱", en: "email address" },
  "basic.phone": { zh: "电话", en: "phone number" },
  "basic.location": { zh: "所在城市", en: "location" },
  "basic.employmentStatus": { zh: "在职状态", en: "employment status" },
  "basic.birthDate": { zh: "出生日期", en: "birth date" },
  "basic.website": { zh: "个人网站", en: "personal website" },
  "basic.github": { zh: "GitHub 主页", en: "GitHub profile" },
  "basic.linkedin": { zh: "LinkedIn 主页", en: "LinkedIn profile" },
  "targetJob.company": { zh: "目标公司名称", en: "target company name" },
  "targetJob.title": { zh: "目标职位", en: "target job title" },
  "targetJob.jobDescription": { zh: "岗位描述", en: "job description" },
  "education.school": { zh: "毕业院校", en: "school name" },
  "education.major": { zh: "专业", en: "major" },
  "education.degree": { zh: "学历", en: "degree" },
  "education.startDate": { zh: "入学时间", en: "enrollment date" },
  "education.endDate": { zh: "毕业时间", en: "graduation date" },
  "education.gpa": { zh: "GPA", en: "GPA" },
  "experience.company": { zh: "工作经历中的公司名称", en: "company name for the work experience" },
  "experience.position": { zh: "工作职位", en: "job title" },
  "experience.date": { zh: "工作起止日期", en: "employment start and end dates" },
  "experience.details": { zh: "工作内容与成果", en: "responsibilities and achievements" },
  "projects.name": { zh: "项目名称", en: "project name" },
  "projects.role": { zh: "项目角色", en: "project role" },
  "projects.date": { zh: "项目起止时间", en: "project dates" },
  "projects.link": { zh: "项目链接", en: "project link" },
  summary: { zh: "个人总结", en: "professional summary" },
  skills: { zh: "专业技能", en: "skills" },
  certifications: { zh: "证书", en: "certifications" },
};

const KNOWN_SECTION = /^(basic|targetJob|education|experience|projects|summary|skills|certifications)\b/;

/** 形如 basic.email / targetJob.company / experience[0].company 的字段路径 */
export const isFieldPathLike = (text: string) =>
  KNOWN_SECTION.test(text) && /^[a-zA-Z]+(\[\d+\])?(\.[a-zA-Z]+)+$/.test(text.trim());

const humanizeOne = (raw: string, language: ResumeAgentLocale) => {
  const clean = raw.replace(/\[\d+\]/g, "");
  const key = clean.split(".").slice(0, 2).join(".");
  const label = FIELD_LABELS[key] ?? FIELD_LABELS[clean.split(".").pop() ?? ""];
  if (!label) return undefined;
  return language === "zh" ? `请补充${label.zh}` : `Please provide ${label.en}`;
};

/**
 * 若文本是字段路径则翻译成可读问题；否则原样返回（自然句子不受影响）。
 */
export const humanizeFieldKey = (text: string, language: ResumeAgentLocale): string => {
  const trimmed = text.trim();
  if (!isFieldPathLike(trimmed)) return text;
  return humanizeOne(trimmed, language) ?? text;
};

/**
 * 语义主题（去重用）。模型常把同一件事写两遍——一次进 missingFields、一次进 followUpQuestions，
 * 逐字去重抓不到，按主题归并。服务端与前端兜底共用这份定义。
 */
export const QUESTION_TOPIC_PATTERNS: Array<{ topic: string; pattern: RegExp }> = [
  { topic: "company", pattern: /(公司名称|雇主|employer|company name)/i },
  { topic: "employment-date", pattern: /(起止日期|任职时间|入职|离职|工作年限|employment date)/i },
  { topic: "school", pattern: /(毕业院校|学校名称|school name|university|alma mater)/i },
  { topic: "metric", pattern: /(量化|成果数据|指标|metric|quantif)/i },
  { topic: "current-status", pattern: /(在职状态|是否在职|current status|still employed)/i },
  { topic: "links", pattern: /(作品集|github|linkedin|个人网站|portfolio|个人主页)/i },
  { topic: "birth", pattern: /(出生日期|生日|birth ?date|date of birth)/i },
  { topic: "tech-stack", pattern: /(技术栈|技术方案|tech ?stack|technolog)/i },
];

const topicsOf = (text: string) =>
  QUESTION_TOPIC_PATTERNS.filter((entry) => entry.pattern.test(text)).map((entry) => entry.topic);

const normalizeForDedup = (text: string) => text.replace(/\s+/g, "").toLowerCase();

/**
 * 渲染层兜底去重：保证弹出的问题两两独立。
 * 1) 逐字去重；2) 子串去重（一条是另一条的子串时保留更完整的）；3) 主题归并。
 * 顺带把字段路径翻译成人话。不依赖服务端，历史 Job 数据也会被清理。
 */
export const dedupeQuestions = (
  questions: ResumeAgentPendingQuestion[],
  language: ResumeAgentLocale
): ResumeAgentPendingQuestion[] => {
  const out: ResumeAgentPendingQuestion[] = [];
  const seenExact = new Set<string>();
  const byTopic = new Map<string, number>();

  for (const q of questions) {
    const text = humanizeFieldKey(q.question, language);
    const hint = q.hint ? humanizeFieldKey(q.hint, language) : undefined;
    const key = normalizeForDedup(text);
    if (seenExact.has(key)) continue;

    // 子串去重：若新问句是已有问句的子串则跳过；若已有问句是新问句的子串则用更完整的新问句替换
    const contained = out.findIndex((o) => {
      const oKey = normalizeForDedup(o.question);
      return oKey.includes(key) || key.includes(oKey);
    });
    if (contained >= 0) {
      const existing = out[contained];
      if (key.length > normalizeForDedup(existing.question).length) {
        out[contained] = { ...existing, question: text, hint: existing.hint ?? hint ?? existing.question };
      }
      continue;
    }

    const topics = topicsOf(text);
    const hitTopic = topics.find((topic) => byTopic.has(topic));
    if (hitTopic !== undefined) {
      const index = byTopic.get(hitTopic) as number;
      const existing = out[index];
      if (!existing.hint && text.length > existing.question.length) {
        out[index] = { ...existing, hint: text };
      }
      continue;
    }

    seenExact.add(key);
    for (const topic of topics) byTopic.set(topic, out.length);
    out.push(q.question === text && (q.hint ?? "") === (hint ?? "") ? q : { ...q, question: text, hint });
  }
  return out;
};
