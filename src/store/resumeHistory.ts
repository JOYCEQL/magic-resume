import { DEFAULT_TEMPLATES } from "@/config";
import type { ResumeData } from "../types/resume";

export const HISTORY_LIMIT = 50;

const HISTORY_GROUP_WINDOW_MS = 1000;

export interface UpdateResumeOptions {
  recordHistory?: boolean;
}

interface HistoryGroup {
  key: string;
  timestamp: number;
}

const lastHistoryGroups = new Map<string, HistoryGroup>();

export const cloneResume = (resume: ResumeData): ResumeData => {
  if (typeof structuredClone === "function") {
    return structuredClone(resume);
  }

  return JSON.parse(JSON.stringify(resume)) as ResumeData;
};

export const getHistoryKey = (
  data: Partial<ResumeData>,
  options?: UpdateResumeOptions
) => {
  if (options?.recordHistory === false) {
    return null;
  }

  const recordableKeys = Object.keys(data).filter(
    (key) =>
      key !== "updatedAt" &&
      key !== "activeSection" &&
      key !== "draggingProjectId"
  );

  return recordableKeys.length > 0 ? recordableKeys.sort().join("|") : null;
};

export const shouldPushHistoryEntry = (
  resumeId: string,
  historyKey: string
) => {
  const now = Date.now();
  const lastGroup = lastHistoryGroups.get(resumeId);
  const shouldPush =
    !lastGroup ||
    lastGroup.key !== historyKey ||
    now - lastGroup.timestamp > HISTORY_GROUP_WINDOW_MS;

  if (shouldPush) {
    lastHistoryGroups.set(resumeId, {
      key: historyKey,
      timestamp: now,
    });
  }

  return shouldPush;
};

export const pushHistory = (
  history: Record<string, ResumeData[]>,
  resumeId: string,
  resume: ResumeData
) => ({
  ...history,
  [resumeId]: [...(history[resumeId] ?? []), cloneResume(resume)].slice(
    -HISTORY_LIMIT
  ),
});

const getRestoredTemplateId = (
  snapshot: ResumeData,
  currentResume: ResumeData
) => {
  const snapshotTemplateExists = DEFAULT_TEMPLATES.some(
    (template) => template.id === snapshot.templateId
  );
  if (snapshotTemplateExists) {
    return snapshot.templateId;
  }

  const currentTemplateExists = DEFAULT_TEMPLATES.some(
    (template) => template.id === currentResume.templateId
  );
  if (currentTemplateExists) {
    return currentResume.templateId;
  }

  return DEFAULT_TEMPLATES[0]?.id;
};

const getRestoredActiveSection = (
  snapshot: ResumeData,
  currentResume: ResumeData
) => {
  const sectionIds = new Set(
    snapshot.menuSections.map((section) => section.id)
  );

  if (sectionIds.has(currentResume.activeSection)) {
    return currentResume.activeSection;
  }

  if (sectionIds.has(snapshot.activeSection)) {
    return snapshot.activeSection;
  }

  return snapshot.menuSections[0]?.id ?? "basic";
};

export const restoreResumeSnapshot = (
  snapshot: ResumeData,
  currentResume: ResumeData
): ResumeData => ({
  ...cloneResume(snapshot),
  templateId: getRestoredTemplateId(snapshot, currentResume),
  updatedAt: new Date().toISOString(),
  activeSection: getRestoredActiveSection(snapshot, currentResume),
  draggingProjectId: currentResume.draggingProjectId,
});

export const clearHistoryGroup = (resumeId: string) => {
  lastHistoryGroups.delete(resumeId);
};
