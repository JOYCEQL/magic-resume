import { generateUUID } from "@/utils/uuid";
import { initialResumeState } from "@/config/initialResumeData";
import { DEFAULT_TEMPLATES } from "@/config";

export const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

export const toString = (value: unknown) =>
  typeof value === "string" ? value.trim() : "";

export const toStringArray = (value: unknown) => {
  if (Array.isArray(value)) {
    return value
      .map((item) => toString(item))
      .filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(/\r?\n/)
      .map((line) => line.replace(/^[-*•\d.)\s]+/, "").trim())
      .filter(Boolean);
  }

  return [] as string[];
};

export const toListHtml = (value: unknown) => {
  const items = toStringArray(value);
  if (items.length === 0) return "";
  return `<ul>${items
    .map((item) => `<li>${escapeHtml(item)}</li>`)
    .join("")}</ul>`;
};

export const extractJsonContent = (content: string) => {
  const direct = content.trim();
  try {
    return JSON.parse(direct);
  } catch (error) { }

  const fencedMatch = direct.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fencedMatch?.[1]) {
    try {
      return JSON.parse(fencedMatch[1].trim());
    } catch (error) { }
  }

  const objectMatch = direct.match(/\{[\s\S]*\}/);
  if (objectMatch?.[0]) {
    try {
      return JSON.parse(objectMatch[0]);
    } catch (error) { }
  }

  throw new Error("Invalid AI JSON content");
};

export const createResumeFromAIResult = (result: any, fileName: string) => {
  const now = new Date().toISOString();
  const id = generateUUID();

  const education = Array.isArray(result?.education) ? result.education : [];
  const experience = Array.isArray(result?.experience) ? result.experience : [];
  const projects = Array.isArray(result?.projects) ? result.projects : [];

  const skillSource = result?.skillContent ?? result?.skills;
  const skillContent = toListHtml(skillSource);

  return {
    ...initialResumeState,
    id,
    title: toString(result?.title) || fileName || `Imported Resume ${id.slice(0, 6)}`,
    createdAt: now,
    updatedAt: now,
    templateId: DEFAULT_TEMPLATES[0]?.id,
    basic: {
      ...initialResumeState.basic,
      name: toString(result?.basic?.name),
      title: toString(result?.basic?.title),
      email: toString(result?.basic?.email),
      phone: toString(result?.basic?.phone),
      location: toString(result?.basic?.location),
      employementStatus: toString(result?.basic?.employementStatus),
      birthDate: toString(result?.basic?.birthDate),
      customFields: [],
      photo: "",
      githubKey: "",
      githubUseName: "",
      githubContributionsVisible: false,
    },
    education: education
      .map((item: any) => ({
        id: generateUUID(),
        school: toString(item?.school),
        major: toString(item?.major),
        degree: toString(item?.degree),
        startDate: toString(item?.startDate),
        endDate: toString(item?.endDate),
        gpa: toString(item?.gpa),
        description: toListHtml(item?.description),
        visible: true,
      }))
      .filter((item: any) => item.school || item.major || item.degree),
    experience: experience
      .map((item: any) => ({
        id: generateUUID(),
        company: toString(item?.company),
        position: toString(item?.position),
        date: toString(item?.date),
        details: toListHtml(item?.details || item?.description),
        visible: true,
      }))
      .filter((item: any) => item.company || item.position || item.date || item.details),
    projects: projects
      .map((item: any) => ({
        id: generateUUID(),
        name: toString(item?.name),
        role: toString(item?.role),
        date: toString(item?.date),
        description: toListHtml(item?.description || item?.details),
        link: toString(item?.link),
        linkLabel: toString(
          item?.linkLabel ??
            item?.linkText ??
            item?.displayText ??
            item?.linkDisplayText
        ),
        visible: true,
      }))
      .filter((item: any) => item.name || item.role || item.date || item.description),
    skillContent,
    customData: {},
  };
};
