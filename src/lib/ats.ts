import type { ResumeData } from "@/types/resume";

const ATS_SECTION_IDS = [
  "basic",
  "selfEvaluation",
  "experience",
  "education",
  "skills",
  "projects",
  "certificates"
] as const;

export type ATSSectionId = (typeof ATS_SECTION_IDS)[number];

export const ATS_SECTIONS_ORDER: ATSSectionId[] = [
  "selfEvaluation",
  "experience",
  "skills",
  "projects",
  "education",
  "certificates",
  "basic"
];

function htmlToText(html: string | undefined | null): string {
  if (!html) return "";
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<\s*br\s*\/?>/gi, "\n")
    .replace(/<\/(p|li|h[1-6]|div)>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function extractATSSections(resume: ResumeData): Record<ATSSectionId, string> {
  const basic = resume.basic ?? ({} as ResumeData["basic"]);
  const basicLines = [
    basic.name && `Name: ${basic.name}`,
    basic.title && `Title: ${basic.title}`,
    basic.email && `Email: ${basic.email}`,
    basic.phone && `Phone: ${basic.phone}`,
    basic.location && `Location: ${basic.location}`,
    basic.employementStatus && `Status: ${basic.employementStatus}`,
    ...(basic.customFields ?? [])
      .filter((f) => f.visible !== false && f.label && f.value)
      .map((f) => `${f.label}: ${f.value}`)
  ].filter(Boolean) as string[];

  const experience = (resume.experience ?? [])
    .filter((e) => e.visible !== false)
    .map((e) =>
      [
        `${e.position || "Position"} @ ${e.company || "Company"}`,
        e.date && `(${e.date})`,
        htmlToText(e.details)
      ]
        .filter(Boolean)
        .join("\n")
    )
    .join("\n\n");

  const education = (resume.education ?? [])
    .filter((e) => e.visible !== false)
    .map((e) =>
      [
        `${e.degree || ""} ${e.major || ""}`.trim() + (e.school ? ` — ${e.school}` : ""),
        [e.startDate, e.endDate].filter(Boolean).join(" - "),
        e.gpa && `GPA: ${e.gpa}`,
        htmlToText(e.description)
      ]
        .filter(Boolean)
        .join("\n")
    )
    .join("\n\n");

  const projects = (resume.projects ?? [])
    .filter((p) => p.visible !== false)
    .map((p) =>
      [
        p.name && `Project: ${p.name}`,
        p.role && `Role: ${p.role}`,
        p.date && `Period: ${p.date}`,
        p.link && `Link: ${p.link}`,
        htmlToText(p.description)
      ]
        .filter(Boolean)
        .join("\n")
    )
    .join("\n\n");

  const skills = htmlToText(resume.skillContent);
  const selfEvaluation = htmlToText(resume.selfEvaluationContent);
  const certificates =
    (resume.certificates ?? []).length > 0
      ? `${resume.certificates.length} certificate image(s) attached`
      : "";

  return {
    basic: basicLines.join("\n"),
    selfEvaluation,
    experience,
    education,
    skills,
    projects,
    certificates
  };
}

export function hasContent(text: string | undefined): boolean {
  return !!text && text.trim().length > 0;
}

export function getATSTier(score: number): "excellent" | "good" | "needsWork" | "poor" {
  if (score >= 85) return "excellent";
  if (score >= 70) return "good";
  if (score >= 50) return "needsWork";
  return "poor";
}

export function getATSColor(score: number): string {
  if (score >= 85) return "text-emerald-500";
  if (score >= 70) return "text-brand-orange";
  if (score >= 50) return "text-brand-orange-soft";
  return "text-destructive";
}

export function getATSGradient(score: number): string {
  if (score >= 85) return "from-emerald-500 to-emerald-400";
  if (score >= 70) return "from-brand-purple to-brand-orange";
  if (score >= 50) return "from-brand-orange-soft to-brand-orange";
  return "from-destructive to-brand-orange";
}
