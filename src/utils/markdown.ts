import TurndownService from "turndown";
import { DEFAULT_FIELD_ORDER } from "@/config";
import { getCustomFieldDisplayText, getCustomFieldHref, shouldShowCustomFieldLabelPrefix } from "@/lib/customField";
import { getProjectLinkMeta } from "@/lib/projectLink";
import { BasicFieldType, BasicInfo, CustomItem, MenuSection, ResumeData } from "@/types/resume";

const HTML_TAG_REGEX = /<\/?[a-z][\s\S]*>/i;
const DATA_URL_REGEX = /^data:/i;

const DEFAULT_BASIC_SECTION_TITLES = {
  basic: "Basic Info",
  skills: "Skills",
  experience: "Experience",
  projects: "Projects",
  education: "Education",
  selfEvaluation: "Self Evaluation",
  certificates: "Certificates"
} as const;

type ExportableBasicFieldKey =
  | "name"
  | "title"
  | "employementStatus"
  | "birthDate"
  | "email"
  | "phone"
  | "location";

const BASIC_FIELD_KEYS = new Set<ExportableBasicFieldKey>([
  "name",
  "title",
  "employementStatus",
  "birthDate",
  "email",
  "phone",
  "location"
]);

const DEFAULT_BASIC_FIELD_LABELS: Record<ExportableBasicFieldKey, string> = {
  name: "Name",
  title: "Title",
  employementStatus: "Employment Status",
  birthDate: "Birth Date",
  email: "Email",
  phone: "Phone",
  location: "Location"
};

export interface ResumeMarkdownOptions {
  basicFieldLabels?: Partial<Record<ExportableBasicFieldKey, string>>;
}

const normalizeText = (value?: string) => value?.trim() || "";
const normalizeDateRangeText = (value?: string) =>
  normalizeText(value)
    .split(/\s+-\s*/)
    .map((part) => part.trim())
    .filter(Boolean)
    .join(" - ");

const createTurndownService = () =>
  new TurndownService({
    headingStyle: "atx",
    bulletListMarker: "-"
  });

const markdownFromText = (value?: string) => {
  const normalized = normalizeText(value);
  if (!normalized) return "";

  if (!HTML_TAG_REGEX.test(normalized)) {
    return normalized;
  }

  return createTurndownService().turndown(normalized).trim();
};

const normalizeMarkdown = (content: string) =>
  content
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

const pickBasicFieldValue = (
  basic: BasicInfo,
  key: ExportableBasicFieldKey
) => normalizeText((basic[key] as string | undefined) || "");

const getOrderedEnabledSections = (resume: ResumeData): MenuSection[] => {
  const enabledSections = (resume.menuSections || [])
    .filter((section) => section.enabled)
    .sort((a, b) => a.order - b.order);

  if (enabledSections.length > 0) return enabledSections;

  return [
    { id: "basic", title: DEFAULT_BASIC_SECTION_TITLES.basic, icon: "", enabled: true, order: 0 },
    { id: "skills", title: DEFAULT_BASIC_SECTION_TITLES.skills, icon: "", enabled: true, order: 1 },
    { id: "experience", title: DEFAULT_BASIC_SECTION_TITLES.experience, icon: "", enabled: true, order: 2 },
    { id: "projects", title: DEFAULT_BASIC_SECTION_TITLES.projects, icon: "", enabled: true, order: 3 },
    { id: "education", title: DEFAULT_BASIC_SECTION_TITLES.education, icon: "", enabled: true, order: 4 },
    { id: "selfEvaluation", title: DEFAULT_BASIC_SECTION_TITLES.selfEvaluation, icon: "", enabled: true, order: 5 },
    { id: "certificates", title: DEFAULT_BASIC_SECTION_TITLES.certificates, icon: "", enabled: true, order: 6 }
  ];
};

const renderBasicSection = (
  title: string,
  resume: ResumeData,
  options?: ResumeMarkdownOptions
) => {
  const fieldOrder = (resume.basic.fieldOrder?.length
    ? resume.basic.fieldOrder
    : DEFAULT_FIELD_ORDER) as BasicFieldType[];

  const lines: string[] = [];
  const name = pickBasicFieldValue(resume.basic, "name");
  const summaryTitle = pickBasicFieldValue(resume.basic, "title");

  if (name) lines.push(`### ${name}`);
  if (summaryTitle) lines.push(summaryTitle);

  for (const field of fieldOrder) {
    const key = field.key as ExportableBasicFieldKey;
    if (!BASIC_FIELD_KEYS.has(key)) continue;
    if (field.visible === false) continue;
    if (key === "name" || key === "title") continue;

    const value = pickBasicFieldValue(resume.basic, key);
    if (!value) continue;

    const label =
      options?.basicFieldLabels?.[key] ||
      normalizeText(field.label) ||
      DEFAULT_BASIC_FIELD_LABELS[key];

    lines.push(`- ${label}: ${value}`);
  }

  const customFieldLines = (resume.basic.customFields || [])
    .filter((field) => field.visible !== false)
    .map((field) => {
      const displayText = normalizeText(getCustomFieldDisplayText(field));
      if (!displayText) return "";

      const href = getCustomFieldHref(field);
      const normalizedLabel = normalizeText(field.label);
      const showPrefix = shouldShowCustomFieldLabelPrefix(field) && normalizedLabel;
      const markdownValue = href
        ? `[${displayText}](${href})`
        : displayText;

      return showPrefix
        ? `- ${normalizedLabel}: ${markdownValue}`
        : `- ${markdownValue}`;
    })
    .filter(Boolean);

  const sectionBlocks = [...lines, ...customFieldLines];
  if (sectionBlocks.length === 0) return "";

  return `## ${title}\n\n${sectionBlocks.join("\n")}`;
};

const renderSkillsSection = (title: string, resume: ResumeData) => {
  const content = markdownFromText(resume.skillContent);
  if (!content) return "";
  return `## ${title}\n\n${content}`;
};

const renderSelfEvaluationSection = (title: string, resume: ResumeData) => {
  const content = markdownFromText(resume.selfEvaluationContent);
  if (!content) return "";
  return `## ${title}\n\n${content}`;
};

const renderExperienceSection = (title: string, resume: ResumeData) => {
  const blocks = resume.experience
    .filter((item) => item.visible)
    .map((item) => {
      const heading = [normalizeText(item.company), normalizeText(item.position)]
        .filter(Boolean)
        .join(" | ");
      const date = normalizeDateRangeText(item.date);
      const details = markdownFromText(item.details);
      const lines: string[] = [];

      if (heading) lines.push(`### ${heading}`);
      if (date) lines.push(`_${date}_`);
      if (details) lines.push(details);

      return lines.join("\n\n");
    })
    .filter(Boolean);

  if (blocks.length === 0) return "";
  return `## ${title}\n\n${blocks.join("\n\n")}`;
};

const renderProjectSection = (title: string, resume: ResumeData) => {
  const blocks = resume.projects
    .filter((item) => item.visible)
    .map((item) => {
      const heading = normalizeText(item.name);
      const meta = [normalizeText(item.role), normalizeDateRangeText(item.date)]
        .filter(Boolean)
        .join(" | ");
      const description = markdownFromText(item.description);
      const linkMeta = getProjectLinkMeta(item, { preferFullUrl: true });
      const lines: string[] = [];

      if (heading) lines.push(`### ${heading}`);
      if (meta) lines.push(`_${meta}_`);
      if (description) lines.push(description);
      if (linkMeta?.href) {
        lines.push(`[${normalizeText(linkMeta.label) || linkMeta.href}](${linkMeta.href})`);
      }

      return lines.join("\n\n");
    })
    .filter(Boolean);

  if (blocks.length === 0) return "";
  return `## ${title}\n\n${blocks.join("\n\n")}`;
};

const renderEducationSection = (title: string, resume: ResumeData) => {
  const blocks = resume.education
    .filter((item) => item.visible)
    .map((item) => {
      const heading = [normalizeText(item.school), normalizeText(item.major)]
        .filter(Boolean)
        .join(" | ");
      const duration = [normalizeText(item.startDate), normalizeText(item.endDate)]
        .filter(Boolean)
        .join(" - ");
      const metadata = [normalizeText(item.degree), duration, item.gpa ? `GPA: ${normalizeText(item.gpa)}` : ""]
        .filter(Boolean)
        .join(" | ");
      const description = markdownFromText(item.description);
      const lines: string[] = [];

      if (heading) lines.push(`### ${heading}`);
      if (metadata) lines.push(`_${metadata}_`);
      if (description) lines.push(description);

      return lines.join("\n\n");
    })
    .filter(Boolean);

  if (blocks.length === 0) return "";
  return `## ${title}\n\n${blocks.join("\n\n")}`;
};

const renderCertificateSection = (title: string, resume: ResumeData) => {
  const lines = resume.certificates
    .map((certificate, index) => {
      const url = normalizeText(certificate.url);
      if (!url) return "";
      if (DATA_URL_REGEX.test(url)) {
        return `- Certificate ${index + 1} (embedded image omitted)`;
      }
      return `- ![Certificate ${index + 1}](${url})`;
    })
    .filter(Boolean);

  if (lines.length === 0) return "";
  return `## ${title}\n\n${lines.join("\n")}`;
};

const renderCustomSection = (title: string, items: CustomItem[]) => {
  const blocks = items
    .filter((item) => item.visible)
    .map((item, index) => {
      const heading =
        normalizeText(item.title) ||
        normalizeText(item.subtitle) ||
        `Item ${index + 1}`;
      const subtitle = normalizeText(item.subtitle);
      const dateRange = normalizeDateRangeText(item.dateRange);
      const details = markdownFromText(item.description);
      const metadata = [subtitle !== heading ? subtitle : "", dateRange]
        .filter(Boolean)
        .join(" | ");
      const lines: string[] = [];

      if (heading) lines.push(`### ${heading}`);
      if (metadata) lines.push(`_${metadata}_`);
      if (details) lines.push(details);

      return lines.join("\n\n");
    })
    .filter(Boolean);

  if (blocks.length === 0) return "";
  return `## ${title}\n\n${blocks.join("\n\n")}`;
};

export const generateResumeMarkdown = (
  resume: ResumeData,
  options?: ResumeMarkdownOptions
) => {
  const topTitle = normalizeText(resume.title) || "Resume";
  const sections = getOrderedEnabledSections(resume);
  const blocks: string[] = [`# ${topTitle}`];

  for (const section of sections) {
    const sectionTitle = normalizeText(section.title) || section.id;
    let content = "";

    switch (section.id) {
      case "basic":
        content = renderBasicSection(sectionTitle, resume, options);
        break;
      case "skills":
        content = renderSkillsSection(sectionTitle, resume);
        break;
      case "experience":
        content = renderExperienceSection(sectionTitle, resume);
        break;
      case "projects":
        content = renderProjectSection(sectionTitle, resume);
        break;
      case "education":
        content = renderEducationSection(sectionTitle, resume);
        break;
      case "selfEvaluation":
        content = renderSelfEvaluationSection(sectionTitle, resume);
        break;
      case "certificates":
        content = renderCertificateSection(sectionTitle, resume);
        break;
      default: {
        const customItems = resume.customData?.[section.id] || [];
        content = renderCustomSection(sectionTitle, customItems);
        break;
      }
    }

    if (content) blocks.push(content);
  }

  return normalizeMarkdown(blocks.join("\n\n"));
};
