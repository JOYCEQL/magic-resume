import { DEFAULT_TEMPLATES } from "@/components/templates/registry";
import { blankResumeState, blankResumeStateEn } from "@/config/initialResumeData";
import type { ResumeData, CustomItem, MenuSection } from "@/types/resume";
import type {
  ResumeAgentValidationIssue,
  ResumeAgentValidationResult,
  ResumeDraft,
  ResumeDraftBasicInfo,
  ResumeDraftEducation,
  ResumeDraftEvidence,
  ResumeDraftExperience,
  ResumeDraftProject,
  ResumeDraftTargetJob,
} from "@/types/resume-agent";
import { generateUUID } from "@/utils/uuid";

const text = (value: unknown) => (typeof value === "string" ? value.trim() : "");
const textArray = (value: unknown) =>
  Array.isArray(value) ? value.map(text).filter(Boolean) : text(value) ? [text(value)] : [];

const normalizeBasic = (value: unknown): ResumeDraftBasicInfo => {
  const source = (value && typeof value === "object" ? value : {}) as Record<string, unknown>;
  return {
    name: text(source.name),
    title: text(source.title),
    email: text(source.email),
    phone: text(source.phone),
    location: text(source.location),
    employmentStatus: text(source.employmentStatus ?? source.employementStatus),
    birthDate: text(source.birthDate),
    website: text(source.website),
    github: text(source.github),
    linkedin: text(source.linkedin),
  };
};

const normalizeTargetJob = (value: unknown): ResumeDraftTargetJob => {
  const source = (value && typeof value === "object" ? value : {}) as Record<string, unknown>;
  return {
    title: text(source.title),
    company: text(source.company),
    jobDescription: text(source.jobDescription),
    matchedKeywords: textArray(source.matchedKeywords),
    missingSkills: textArray(source.missingSkills),
  };
};

const normalizeEducation = (value: unknown): ResumeDraftEducation[] =>
  (Array.isArray(value) ? value : []).map((item) => {
    const source = (item && typeof item === "object" ? item : {}) as Record<string, unknown>;
    return {
      school: text(source.school),
      major: text(source.major),
      degree: text(source.degree),
      startDate: text(source.startDate),
      endDate: text(source.endDate),
      gpa: text(source.gpa),
      details: textArray(source.details ?? source.description),
    };
  });

const normalizeExperience = (value: unknown): ResumeDraftExperience[] =>
  (Array.isArray(value) ? value : []).map((item) => {
    const source = (item && typeof item === "object" ? item : {}) as Record<string, unknown>;
    return {
      company: text(source.company),
      position: text(source.position),
      date: text(source.date),
      details: textArray(source.details ?? source.description),
    };
  });

const normalizeProjects = (value: unknown): ResumeDraftProject[] =>
  (Array.isArray(value) ? value : []).map((item) => {
    const source = (item && typeof item === "object" ? item : {}) as Record<string, unknown>;
    return {
      name: text(source.name),
      role: text(source.role),
      date: text(source.date),
      details: textArray(source.details ?? source.description),
      link: text(source.link),
    };
  });

const normalizeEvidence = (value: unknown): ResumeDraftEvidence[] =>
  (Array.isArray(value) ? value : []).map((item) => {
    const source = (item && typeof item === "object" ? item : {}) as Record<string, unknown>;
    const confidence = text(source.confidence);
    return {
      field: text(source.field),
      source: text(source.source),
      confidence:
        confidence === "high" || confidence === "medium" || confidence === "low"
          ? confidence
          : "low",
    };
  });

export const createEmptyResumeDraft = (language: "zh" | "en" = "zh"): ResumeDraft => ({
  version: 1,
  title: "",
  language,
  targetJob: normalizeTargetJob(null),
  basic: normalizeBasic(null),
  summary: "",
  education: [],
  experience: [],
  projects: [],
  skills: [],
  certifications: [],
  missingFields: [],
  assumptions: [],
  conflicts: [],
  evidence: [],
  followUpQuestions: [],
});

export const normalizeResumeDraft = (
  value: unknown,
  fallbackLanguage: "zh" | "en" = "zh"
): ResumeDraft => {
  const source = (value && typeof value === "object" ? value : {}) as Record<string, unknown>;
  return {
    version: 1,
    title: text(source.title),
    language: source.language === "en" ? "en" : source.language === "zh" ? "zh" : fallbackLanguage,
    targetJob: normalizeTargetJob(source.targetJob),
    basic: normalizeBasic(source.basic),
    summary: text(source.summary),
    education: normalizeEducation(source.education),
    experience: normalizeExperience(source.experience),
    projects: normalizeProjects(source.projects),
    skills: textArray(source.skills),
    certifications: textArray(source.certifications),
    missingFields: textArray(source.missingFields),
    assumptions: textArray(source.assumptions),
    conflicts: textArray(source.conflicts),
    evidence: normalizeEvidence(source.evidence),
    followUpQuestions: textArray(source.followUpQuestions),
  };
};

const issue = (
  type: ResumeAgentValidationIssue["type"],
  severity: ResumeAgentValidationIssue["severity"],
  field: string,
  message: string
): ResumeAgentValidationIssue => ({ id: generateUUID(), type, severity, field, message });

const FIELD_LABELS_ZH: Record<string, string> = {
  "basic.name": "姓名",
  "basic.contact": "联系方式",
  "basic.email": "邮箱",
  "basic.phone": "电话",
  "basic.title": "目标职位",
  "basic.location": "所在地",
  summary: "职业概述",
  education: "教育经历",
  school: "学校名称",
  major: "专业",
  degree: "学历",
  startDate: "开始时间",
  endDate: "结束时间",
  experience: "工作经历",
  company: "公司名称",
  position: "职位名称",
  date: "任职时间",
  projects: "项目经历",
  name: "项目名称",
  role: "项目角色",
  skills: "专业技能",
  certifications: "证书与荣誉",
  "targetJob.title": "目标岗位",
  "targetJob.company": "目标公司",
  "targetJob.jobDescription": "岗位描述",
};

const humanizeFieldPath = (value: string) => {
  const raw = value.trim();
  if (!raw) return "待补充信息";
  if (/[^\x00-\x7F]/.test(raw) && !/^[\w.[\]-]+$/.test(raw)) return raw;
  const normalized = raw.replace(/\[(\d+)\]/g, ".$1").replace(/\.(\d+)\./g, ".$1.");
  const segments = normalized.split(".").filter(Boolean);
  const index = segments.find((segment) => /^\d+$/.test(segment));
  const withoutIndex = segments.filter((segment) => !/^\d+$/.test(segment));
  const fullKey = withoutIndex.join(".");
  const leaf = withoutIndex[withoutIndex.length - 1] || raw;
  const section = withoutIndex[0];
  const sectionLabel = FIELD_LABELS_ZH[section] || "简历信息";
  const fieldLabel = FIELD_LABELS_ZH[fullKey] || FIELD_LABELS_ZH[leaf] || leaf;
  if (index && section === "education") return `第 ${Number(index) + 1} 段教育经历的${fieldLabel}`;
  if (index && section === "experience") return `第 ${Number(index) + 1} 段工作经历的${fieldLabel}`;
  if (index && section === "projects") return `第 ${Number(index) + 1} 个项目的${fieldLabel}`;
  return fieldLabel === sectionLabel ? fieldLabel : `${sectionLabel}中的${fieldLabel}`;
};

const missingFieldMessage = (value: string, zh: boolean) => {
  if (!zh) return value;
  const label = humanizeFieldPath(value);
  return label === value ? value : `建议补充：${label}`;
};

export const validateResumeDraft = (draft: ResumeDraft): ResumeAgentValidationResult => {
  const zh = draft.language !== "en";
  const issues: ResumeAgentValidationIssue[] = [];
  if (!draft.basic.name) issues.push(issue("missing", "error", "basic.name", zh ? "缺少姓名" : "Name is missing"));
  if (!draft.basic.email && !draft.basic.phone) {
    issues.push(issue("missing", "error", "basic.contact", zh ? "邮箱和电话至少填写一项" : "Add at least an email or phone number"));
  }
  if (!draft.basic.title && !draft.targetJob.title) {
    issues.push(issue("missing", "warning", "basic.title", zh ? "缺少目标职位" : "Target role is missing"));
  }
  if (draft.education.length === 0) {
    issues.push(issue("missing", "warning", "education", zh ? "尚未提供教育经历" : "Education has not been provided"));
  }
  if (draft.experience.length === 0 && draft.projects.length === 0) {
    issues.push(issue("missing", "warning", "experience", zh ? "至少补充一段工作或项目经历" : "Add at least one work or project experience"));
  }
  draft.missingFields.forEach((message) =>
    issues.push(issue("missing", "warning", message, missingFieldMessage(message, zh)))
  );
  draft.conflicts.forEach((message) =>
    issues.push(issue("conflict", "error", "draft", zh ? `事实冲突：${message}` : message))
  );
  draft.assumptions.forEach((message) =>
    issues.push(issue("assumption", "warning", "draft", zh ? `待本人确认：${message}` : message))
  );
  draft.evidence
    .filter((item) => item.confidence === "low")
    .forEach((item) =>
      issues.push(
        issue(
          "low-confidence",
          "warning",
          item.field || "draft",
          zh ? `低置信度内容：${item.source || item.field}` : `Low-confidence content: ${item.source || item.field}`
        )
      )
    );
  draft.targetJob.missingSkills.forEach((skill) =>
    issues.push(
      issue(
        "unsupported",
        "info",
        "targetJob.missingSkills",
        zh ? `JD 要求但用户尚未证明掌握：${skill}` : `Required by the JD but not evidenced: ${skill}`
      )
    )
  );
  const errorCount = issues.filter((item) => item.severity === "error").length;
  const warningCount = issues.filter((item) => item.severity === "warning").length;
  return { issues, errorCount, warningCount, canSave: errorCount === 0 };
};

const escapeHtml = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const listHtml = (items: string[]) =>
  items.length ? `<ul>${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>` : "";

/**
 * 技能列表的 HTML。draft.skills 支持模型输出的「类别名: 技能、技能」分组格式
 * （如 "前端开发: React、TypeScript、Tailwind CSS"）：冒号前渲染为加粗的类别名，
 * 冒号后的技能串保持原分隔符；不含冒号的普通条目渲染为单行 <li>。
 * education/experience/projects 的 details 不走此函数，保持普通列表。
 */
const skillListHtml = (items: string[]) => {
  if (!items.length) return "";
  const lines = items
    .map((item) => {
      const raw = item.trim();
      if (!raw) return "";
      const sep = raw.search(/[:：]/);
      if (sep > 0) {
        const category = raw.slice(0, sep).trim();
        const skills = raw.slice(sep + 1).trim();
        if (category && skills) {
          return `<li><strong>${escapeHtml(category)}</strong>：${escapeHtml(skills)}</li>`;
        }
      }
      return `<li>${escapeHtml(raw)}</li>`;
    })
    .filter(Boolean);
  return lines.length ? `<ul>${lines.join("")}</ul>` : "";
};

const customFieldsFromDraft = (draft: ResumeDraft) => {
  const values = [
    ["website", draft.basic.website, "Globe"],
    ["github", draft.basic.github, "Github"],
    ["linkedin", draft.basic.linkedin, "Linkedin"],
  ] as const;
  return values
    .filter(([, value]) => Boolean(value))
    .map(([label, value, icon]) => ({ id: generateUUID(), label, value, icon, visible: true }));
};

export const createResumeFromAgentDraft = (
  draft: ResumeDraft,
  templateId: string
): ResumeData => {
  const now = new Date().toISOString();
  const template = DEFAULT_TEMPLATES.find((item) => item.id === templateId) ?? DEFAULT_TEMPLATES[0];
  const base = draft.language === "en" ? blankResumeStateEn : blankResumeState;
  const menuSections: MenuSection[] = [
    { id: "basic", title: draft.language === "en" ? "Profile" : "基本信息", icon: "user", enabled: true, order: 0 },
    { id: "selfEvaluation", title: draft.language === "en" ? "Professional Summary" : "职业概述", icon: "profile", enabled: Boolean(draft.summary), order: 1 },
    { id: "skills", title: draft.language === "en" ? "Skills" : "专业技能", icon: "skill", enabled: draft.skills.length > 0, order: 2 },
    { id: "experience", title: draft.language === "en" ? "Experience" : "工作经验", icon: "work", enabled: draft.experience.length > 0, order: 3 },
    { id: "projects", title: draft.language === "en" ? "Projects" : "项目经历", icon: "project", enabled: draft.projects.length > 0, order: 4 },
    { id: "education", title: draft.language === "en" ? "Education" : "教育经历", icon: "education", enabled: draft.education.length > 0, order: 5 },
  ];
  const customData: Record<string, CustomItem[]> = {};
  if (draft.certifications.length) {
    menuSections.push({
      id: "agent-certifications",
      title: draft.language === "en" ? "Certifications" : "证书与荣誉",
      icon: "medal",
      enabled: true,
      order: menuSections.length,
    });
    customData["agent-certifications"] = draft.certifications.map((title) => ({
      id: generateUUID(),
      title,
      subtitle: "",
      dateRange: "",
      description: "",
      visible: true,
    }));
  }
  return {
    ...base,
    id: generateUUID(),
    title: draft.title || `${draft.basic.name || (draft.language === "en" ? "Untitled" : "未命名")}${draft.language === "en" ? " Resume" : "的简历"}`,
    createdAt: now,
    updatedAt: now,
    templateId: template?.id,
    basic: {
      ...base.basic,
      name: draft.basic.name,
      title: draft.basic.title || draft.targetJob.title,
      email: draft.basic.email,
      phone: draft.basic.phone,
      location: draft.basic.location,
      employementStatus: draft.basic.employmentStatus,
      birthDate: draft.basic.birthDate,
      customFields: customFieldsFromDraft(draft),
      layout: template?.basic.layout,
    },
    education: draft.education.map((item) => ({ ...item, id: generateUUID(), description: listHtml(item.details), visible: true })),
    experience: draft.experience.map((item) => ({ id: generateUUID(), company: item.company, position: item.position, date: item.date, details: listHtml(item.details), visible: true })),
    projects: draft.projects.map((item) => ({ id: generateUUID(), name: item.name, role: item.role, date: item.date, description: listHtml(item.details), link: item.link, visible: true })),
    certificates: [],
    customData,
    skillContent: skillListHtml(draft.skills),
    selfEvaluationContent: draft.summary ? `<p>${draft.summary.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>` : "",
    menuSections,
    activeSection: "basic",
    globalSettings: {
      ...base.globalSettings,
      themeColor: template?.colorScheme.primary,
      sectionSpacing: template?.spacing.sectionGap,
      paragraphSpacing: template?.spacing.itemGap,
      pagePadding: template?.spacing.contentPadding,
    },
  };
};
