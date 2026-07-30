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
  draft.missingFields.forEach((message) => issues.push(issue("missing", "warning", "draft", message)));
  draft.conflicts.forEach((message) => issues.push(issue("conflict", "error", "draft", message)));
  draft.assumptions.forEach((message) => issues.push(issue("assumption", "warning", "draft", message)));
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

const listHtml = (items: string[]) =>
  items.length
    ? `<ul>${items
        .map((item) => `<li>${item.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</li>`)
        .join("")}</ul>`
    : "";

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
    skillContent: listHtml(draft.skills),
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
