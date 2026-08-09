import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { StateStorage } from "zustand/middleware";
import { getFileHandle, verifyPermission } from "@/utils/fileSystem";
import {
  BasicInfo,
  Education,
  Experience,
  GlobalSettings,
  Project,
  CustomItem,
  ResumeData,
  MenuSection,
  Certificate,
} from "../types/resume";
import { DEFAULT_TEMPLATES } from "@/config";
import {
  initialResumeState,
  initialResumeStateEn,
  blankResumeState,
  blankResumeStateEn,
} from "@/config/initialResumeData";
import { generateUUID } from "@/utils/uuid";
import {
  HISTORY_LIMIT,
  type UpdateResumeOptions,
  cloneResume,
  getHistoryKey,
  shouldPushHistoryEntry,
  pushHistory,
  restoreResumeSnapshot,
  clearHistoryGroup,
} from "./resumeHistory";

interface PendingSync {
  timer: ReturnType<typeof setTimeout>;
  prevResume?: ResumeData;
}

interface ResumeStore {
  resumes: Record<string, ResumeData>;
  activeResumeId: string | null;
  activeResume: ResumeData | null;
  history: Record<string, ResumeData[]>;
  future: Record<string, ResumeData[]>;

  createResume: (templateId: string | null, isBlank?: boolean) => string;
  deleteResume: (resume: ResumeData) => void;
  duplicateResume: (resumeId: string) => string;
  updateResume: (
    resumeId: string,
    data: Partial<ResumeData>,
    options?: UpdateResumeOptions
  ) => void;
  setActiveResume: (resumeId: string) => void;
  updateResumeFromFile: (
    resume: ResumeData,
    sourceModifiedAt?: number
  ) => boolean;
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;

  updateResumeTitle: (title: string) => void;
  updateBasicInfo: (data: Partial<BasicInfo>) => void;
  updateEducation: (data: Education) => void;
  updateEducationBatch: (educations: Education[]) => void;
  deleteEducation: (id: string) => void;
  updateExperience: (data: Experience) => void;
  updateExperienceBatch: (experiences: Experience[]) => void;
  deleteExperience: (id: string) => void;
  updateProjects: (project: Project) => void;
  updateProjectsBatch: (projects: Project[]) => void;
  deleteProject: (id: string) => void;
  setDraggingProjectId: (id: string | null) => void;
  updateSkillContent: (skillContent: string) => void;
  updateSelfEvaluationContent: (content: string) => void;
  reorderSections: (newOrder: ResumeData["menuSections"]) => void;
  toggleSectionVisibility: (sectionId: string) => void;
  setActiveSection: (sectionId: string) => void;
  updateMenuSections: (sections: ResumeData["menuSections"]) => void;
  createCustomSection: (section: MenuSection) => void;
  updateCustomData: (sectionId: string, items: CustomItem[]) => void;
  removeCustomData: (sectionId: string) => void;
  addCustomItem: (sectionId: string) => void;
  updateCustomItem: (
    sectionId: string,
    itemId: string,
    updates: Partial<CustomItem>
  ) => void;
  removeCustomItem: (sectionId: string, itemId: string) => void;
  updateGlobalSettings: (settings: Partial<GlobalSettings>) => void;
  setThemeColor: (color: string) => void;
  setTemplate: (templateId: string) => void;
  addResume: (resume: ResumeData) => string;
  addCertificate: (certificate: Certificate) => void;
  updateCertificate: (id: string, updates: Partial<Certificate>) => void;
  updateCertificatesBatch: (certificates: Certificate[]) => void;
  removeCertificate: (id: string) => void;
}

type PersistedResumeStore = Pick<ResumeStore, "resumes" | "activeResumeId">;

const createDefaultCustomItem = (): CustomItem => ({
  id: generateUUID(),
  title: "未命名模块",
  subtitle: "",
  dateRange: "",
  description: "",
  visible: true,
});

const warnedPersistFailures = new Set<string>();

const warnPersistFailure = (name: string, error: unknown) => {
  if (warnedPersistFailures.has(name)) {
    return;
  }

  warnedPersistFailures.add(name);
  console.warn(
    `[resume-store] Failed to persist "${name}" to localStorage. Changes remain available in memory for this session.`,
    error
  );
};

const createSafeLocalStorage = (): StateStorage => ({
  getItem: (name) => localStorage.getItem(name),
  setItem: (name, value) => {
    try {
      localStorage.setItem(name, value);
    } catch (error) {
      warnPersistFailure(name, error);
    }
  },
  removeItem: (name) => localStorage.removeItem(name),
});

const parseTimestamp = (value?: string): number | null => {
  if (!value) {
    return null;
  }

  const timestamp = new Date(value).getTime();
  return Number.isFinite(timestamp) ? timestamp : null;
};

const shouldImportResumeFromFile = (
  fileResume: ResumeData,
  localResume?: ResumeData,
  sourceModifiedAt?: number
) => {
  if (!localResume) {
    return true;
  }

  const fileUpdatedAt = parseTimestamp(fileResume.updatedAt);
  const localUpdatedAt = parseTimestamp(localResume.updatedAt);
  const fileModifiedAt =
    typeof sourceModifiedAt === "number" && Number.isFinite(sourceModifiedAt)
      ? sourceModifiedAt
      : null;

  if (fileUpdatedAt !== null && localUpdatedAt !== null) {
    if (fileUpdatedAt !== localUpdatedAt) {
      return fileUpdatedAt > localUpdatedAt;
    }

    return fileModifiedAt !== null && fileModifiedAt > localUpdatedAt + 1000;
  }

  if (fileUpdatedAt !== null && localUpdatedAt === null) {
    return true;
  }

  if (fileUpdatedAt === null && localUpdatedAt !== null) {
    return fileModifiedAt !== null && fileModifiedAt > localUpdatedAt + 1000;
  }

  return fileModifiedAt !== null;
};

const normalizeImportedResume = (
  resume: ResumeData,
  sourceModifiedAt?: number
) => {
  if (
    typeof sourceModifiedAt !== "number" ||
    !Number.isFinite(sourceModifiedAt)
  ) {
    return resume;
  }

  const fileUpdatedAt = parseTimestamp(resume.updatedAt);
  if (fileUpdatedAt !== null && fileUpdatedAt >= sourceModifiedAt) {
    return resume;
  }

  return {
    ...resume,
    updatedAt: new Date(sourceModifiedAt).toISOString(),
  };
};

// 同步简历到文件系统
const syncResumeToFile = async (
  resumeData: ResumeData,
  prevResume?: ResumeData
) => {
  if (typeof window === "undefined" || typeof indexedDB === "undefined") {
    return;
  }

  try {
    const handle = await getFileHandle("syncDirectory");
    if (!handle) {
      return;
    }

    const hasPermission = await verifyPermission(handle);
    if (!hasPermission) {
      return;
    }

    const dirHandle = handle as FileSystemDirectoryHandle;

    if (
      prevResume &&
      prevResume.id === resumeData.id &&
      prevResume.title !== resumeData.title
    ) {
      try {
        await dirHandle.removeEntry(`${prevResume.title}.json`);
      } catch (error) {
        console.warn("Error deleting old file:", error);
      }
    }

    const fileName = `${resumeData.title}.json`;
    const fileHandle = await dirHandle.getFileHandle(fileName, {
      create: true,
    });
    const writable = await fileHandle.createWritable();
    await writable.write(JSON.stringify(resumeData, null, 2));
    await writable.close();
  } catch (error) {
    console.error("Error syncing resume to file:", error);
  }
};

// 防抖同步：按简历合并高频写入，避免不同简历之间互相取消文件同步
const pendingSyncs = new Map<string, PendingSync>();

const clearPendingSync = (resumeId: string) => {
  const pendingSync = pendingSyncs.get(resumeId);
  if (!pendingSync) {
    return;
  }

  clearTimeout(pendingSync.timer);
  pendingSyncs.delete(resumeId);
};

const debouncedSyncToFile = (
  resumeData: ResumeData,
  prevResume?: ResumeData
) => {
  const pendingSync = pendingSyncs.get(resumeData.id);
  if (pendingSync) {
    clearTimeout(pendingSync.timer);
  }

  const prevResumeForSync = pendingSync?.prevResume ?? prevResume;
  const timer = setTimeout(() => {
    syncResumeToFile(resumeData, prevResumeForSync);
    pendingSyncs.delete(resumeData.id);
  }, 1500);

  pendingSyncs.set(resumeData.id, {
    timer,
    prevResume: prevResumeForSync,
  });
};

export const useResumeStore = create(
  persist<ResumeStore, [], [], PersistedResumeStore>(
    (set, get) => ({
      resumes: {},
      activeResumeId: null,
      activeResume: null,
      history: {},
      future: {},

      createResume: (templateId = null, isBlank = false) => {
        const locale =
          typeof document !== "undefined"
            ? document.cookie
                .split("; ")
                .find((row) => row.startsWith("NEXT_LOCALE="))
                ?.split("=")[1] || "zh"
            : "zh";

        let initialResumeData: any;
        if (isBlank) {
          initialResumeData =
            locale === "en" ? blankResumeStateEn : blankResumeState;
        } else {
          initialResumeData =
            locale === "en" ? initialResumeStateEn : initialResumeState;
        }

        const id = generateUUID();
        const template = templateId
          ? DEFAULT_TEMPLATES.find((t) => t.id === templateId)
          : DEFAULT_TEMPLATES[0];

        const newResume: ResumeData = {
          ...initialResumeData,
          id,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          templateId: template?.id,
          title: `${locale === "en" ? "New Resume" : "新建简历"} ${id.slice(
            0,
            6
          )}`,
        };

        set((state) => ({
          resumes: {
            ...state.resumes,
            [id]: newResume,
          },
          activeResumeId: id,
          activeResume: newResume,
          history: {
            ...state.history,
            [id]: [],
          },
          future: {
            ...state.future,
            [id]: [],
          },
        }));

        syncResumeToFile(newResume);

        return id;
      },

      updateResume: (resumeId, data, options) => {
        set((state) => {
          const resume = state.resumes[resumeId];
          if (!resume) return state;

          const historyKey = getHistoryKey(data, options);
          const shouldPushHistory =
            !!historyKey && shouldPushHistoryEntry(resumeId, historyKey);
          const shouldClearFuture = !!historyKey;
          const updatedResume = {
            ...resume,
            ...data,
            updatedAt: new Date().toISOString(),
          };

          debouncedSyncToFile(updatedResume, resume);

          return {
            resumes: {
              ...state.resumes,
              [resumeId]: updatedResume,
            },
            activeResume:
              state.activeResumeId === resumeId
                ? updatedResume
                : state.activeResume,
            history: shouldPushHistory
              ? pushHistory(state.history, resumeId, resume)
              : state.history,
            future: shouldClearFuture
              ? {
                  ...state.future,
                  [resumeId]: [],
                }
              : state.future,
          };
        });
      },

      // 从文件更新，直接更新resumes
      updateResumeFromFile: (resume, sourceModifiedAt) => {
        const localResume = get().resumes[resume.id];
        if (!shouldImportResumeFromFile(resume, localResume, sourceModifiedAt)) {
          return false;
        }

        const importedResume = normalizeImportedResume(resume, sourceModifiedAt);
        clearHistoryGroup(importedResume.id);
        clearPendingSync(importedResume.id);

        set((state) => ({
          resumes: {
            ...state.resumes,
            [importedResume.id]: importedResume,
          },
          activeResume:
            state.activeResumeId === importedResume.id
              ? importedResume
              : state.activeResume,
          history: {
            ...state.history,
            [importedResume.id]: [],
          },
          future: {
            ...state.future,
            [importedResume.id]: [],
          },
        }));

        return true;
      },

      undo: () => {
        const { activeResumeId } = get();
        if (!activeResumeId) return;

        set((state) => {
          const currentResume = state.resumes[activeResumeId];
          const resumeHistory = state.history[activeResumeId] ?? [];
          const previousResume = resumeHistory[resumeHistory.length - 1];
          if (!currentResume || !previousResume) return state;

          const restoredResume = restoreResumeSnapshot(
            previousResume,
            currentResume
          );
          clearHistoryGroup(activeResumeId);

          debouncedSyncToFile(restoredResume, currentResume);

          return {
            resumes: {
              ...state.resumes,
              [activeResumeId]: restoredResume,
            },
            activeResume: restoredResume,
            history: {
              ...state.history,
              [activeResumeId]: resumeHistory.slice(0, -1),
            },
            future: {
              ...state.future,
              [activeResumeId]: [
                cloneResume(currentResume),
                ...(state.future[activeResumeId] ?? []),
              ].slice(0, HISTORY_LIMIT),
            },
          };
        });
      },

      redo: () => {
        const { activeResumeId } = get();
        if (!activeResumeId) return;

        set((state) => {
          const currentResume = state.resumes[activeResumeId];
          const resumeFuture = state.future[activeResumeId] ?? [];
          const nextResume = resumeFuture[0];
          if (!currentResume || !nextResume) return state;

          const restoredResume = restoreResumeSnapshot(
            nextResume,
            currentResume
          );
          clearHistoryGroup(activeResumeId);

          debouncedSyncToFile(restoredResume, currentResume);

          return {
            resumes: {
              ...state.resumes,
              [activeResumeId]: restoredResume,
            },
            activeResume: restoredResume,
            history: pushHistory(state.history, activeResumeId, currentResume),
            future: {
              ...state.future,
              [activeResumeId]: resumeFuture.slice(1),
            },
          };
        });
      },

      canUndo: () => {
        const { activeResumeId, history } = get();
        return !!activeResumeId && (history[activeResumeId]?.length ?? 0) > 0;
      },

      canRedo: () => {
        const { activeResumeId, future } = get();
        return !!activeResumeId && (future[activeResumeId]?.length ?? 0) > 0;
      },

      updateResumeTitle: (title) => {
        const { activeResumeId } = get();
        if (activeResumeId) {
          get().updateResume(activeResumeId, { title });
        }
      },

      deleteResume: (resume) => {
        const resumeId = resume.id;
        clearHistoryGroup(resumeId);
        clearPendingSync(resumeId);
        set((state) => {
          const { [resumeId]: _, activeResume, ...rest } = state.resumes;
          const { [resumeId]: __, ...historyRest } = state.history;
          const { [resumeId]: ___, ...futureRest } = state.future;
          return {
            resumes: rest,
            activeResumeId: null,
            activeResume: null,
            history: historyRest,
            future: futureRest,
          };
        });

        (async () => {
          try {
            const handle = await getFileHandle("syncDirectory");
            if (!handle) return;

            const hasPermission = await verifyPermission(handle);
            if (!hasPermission) return;

            const dirHandle = handle as FileSystemDirectoryHandle;
            try {
              await dirHandle.removeEntry(`${resume.title}.json`);
            } catch (error) {}
          } catch (error) {
            console.error("Error deleting resume file:", error);
          }
        })();
      },

      duplicateResume: (resumeId) => {
        const newId = generateUUID();
        const originalResume = get().resumes[resumeId];
        if (!originalResume) {
          return "";
        }

        // 获取当前语言环境
        const locale =
          typeof document !== "undefined"
            ? document.cookie
                .split("; ")
                .find((row) => row.startsWith("NEXT_LOCALE="))
                ?.split("=")[1] || "zh"
            : "zh";

        const duplicatedResume = {
          ...structuredClone(originalResume),
          id: newId,
          title: `${originalResume.title} (${
            locale === "en" ? "Copy" : "复制"
          })`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        set((state) => ({
          resumes: {
            ...state.resumes,
            [newId]: duplicatedResume,
          },
          activeResumeId: newId,
          activeResume: duplicatedResume,
          history: {
            ...state.history,
            [newId]: [],
          },
          future: {
            ...state.future,
            [newId]: [],
          },
        }));

        return newId;
      },

      setActiveResume: (resumeId) => {
        const { resumes, activeResume, activeResumeId } = get();
        const nextResume = resumes[resumeId] ?? null;

        if (activeResumeId === resumeId && activeResume === nextResume) {
          return;
        }

        set({ activeResume: nextResume, activeResumeId: resumeId });
      },

      updateBasicInfo: (data) => {
        const { activeResumeId, activeResume } = get();
        if (activeResumeId && activeResume) {
          get().updateResume(activeResumeId, {
            basic: {
              ...activeResume.basic,
              ...data,
            },
          });
        }
      },

      updateEducation: (education) => {
        const { activeResumeId, resumes } = get();
        if (!activeResumeId) return;

        const currentResume = resumes[activeResumeId];
        const newEducation = currentResume.education.some(
          (e) => e.id === education.id
        )
          ? currentResume.education.map((e) =>
              e.id === education.id ? education : e
            )
          : [...currentResume.education, education];

        get().updateResume(activeResumeId, { education: newEducation });
      },

      updateEducationBatch: (educations) => {
        const { activeResumeId } = get();
        if (activeResumeId) {
          get().updateResume(activeResumeId, { education: educations });
        }
      },

      deleteEducation: (id) => {
        const { activeResumeId } = get();
        if (activeResumeId) {
          const resume = get().resumes[activeResumeId];
          const updatedEducation = resume.education.filter((e) => e.id !== id);
          get().updateResume(activeResumeId, { education: updatedEducation });
        }
      },

      updateExperience: (experience) => {
        const { activeResumeId, resumes } = get();
        if (!activeResumeId) return;

        const currentResume = resumes[activeResumeId];
        const newExperience = currentResume.experience.find(
          (e) => e.id === experience.id
        )
          ? currentResume.experience.map((e) =>
              e.id === experience.id ? experience : e
            )
          : [...currentResume.experience, experience];

        get().updateResume(activeResumeId, { experience: newExperience });
      },

      updateExperienceBatch: (experiences: Experience[]) => {
        const { activeResumeId } = get();
        if (activeResumeId) {
          const updateData = { experience: experiences };
          get().updateResume(activeResumeId, updateData);
        }
      },
      deleteExperience: (id) => {
        const { activeResumeId, resumes } = get();
        if (!activeResumeId) return;

        const currentResume = resumes[activeResumeId];
        const updatedExperience = currentResume.experience.filter(
          (e) => e.id !== id
        );

        get().updateResume(activeResumeId, { experience: updatedExperience });
      },

      updateProjects: (project) => {
        const { activeResumeId, resumes } = get();
        if (!activeResumeId) return;
        const currentResume = resumes[activeResumeId];
        const newProjects = currentResume.projects.some(
          (p) => p.id === project.id
        )
          ? currentResume.projects.map((p) =>
              p.id === project.id ? project : p
            )
          : [...currentResume.projects, project];

        get().updateResume(activeResumeId, { projects: newProjects });
      },

      updateProjectsBatch: (projects: Project[]) => {
        const { activeResumeId } = get();
        if (activeResumeId) {
          const updateData = { projects };
          get().updateResume(activeResumeId, updateData);
        }
      },

      deleteProject: (id) => {
        const { activeResumeId } = get();
        if (!activeResumeId) return;
        const currentResume = get().resumes[activeResumeId];
        const updatedProjects = currentResume.projects.filter(
          (p) => p.id !== id
        );
        get().updateResume(activeResumeId, { projects: updatedProjects });
      },

      setDraggingProjectId: (id: string | null) => {
        const { activeResumeId } = get();
        if (activeResumeId) {
          get().updateResume(
            activeResumeId,
            { draggingProjectId: id },
            { recordHistory: false }
          );
        }
      },

      updateSkillContent: (skillContent) => {
        const { activeResumeId } = get();
        if (activeResumeId) {
          get().updateResume(activeResumeId, { skillContent });
        }
      },

      updateSelfEvaluationContent: (selfEvaluationContent) => {
        const { activeResumeId } = get();
        if (activeResumeId) {
          get().updateResume(activeResumeId, { selfEvaluationContent });
        }
      },

      reorderSections: (newOrder) => {
        const { activeResumeId, resumes } = get();
        if (activeResumeId) {
          const currentResume = resumes[activeResumeId];
          const basicInfoSection = currentResume.menuSections.find(
            (section) => section.id === "basic"
          );
          const reorderedSections = [
            basicInfoSection,
            ...newOrder.filter((section) => section.id !== "basic"),
          ].map((section, index) => ({
            ...section,
            order: index,
          }));
          get().updateResume(activeResumeId, {
            menuSections: reorderedSections as MenuSection[],
          });
        }
      },

      toggleSectionVisibility: (sectionId) => {
        const { activeResumeId, resumes } = get();
        if (activeResumeId) {
          const currentResume = resumes[activeResumeId];
          const updatedSections = currentResume.menuSections.map((section) =>
            section.id === sectionId
              ? { ...section, enabled: !section.enabled }
              : section
          );
          get().updateResume(activeResumeId, { menuSections: updatedSections });
        }
      },

      setActiveSection: (sectionId) => {
        const { activeResumeId } = get();
        if (activeResumeId) {
          get().updateResume(
            activeResumeId,
            { activeSection: sectionId },
            { recordHistory: false }
          );
        }
      },

      updateMenuSections: (sections) => {
        const { activeResumeId } = get();
        if (activeResumeId) {
          get().updateResume(activeResumeId, { menuSections: sections });
        }
      },

      createCustomSection: (section) => {
        const { activeResumeId } = get();
        if (!activeResumeId) return;

        const currentResume = get().resumes[activeResumeId];
        get().updateResume(activeResumeId, {
          menuSections: [...currentResume.menuSections, section],
          customData: {
            ...currentResume.customData,
            [section.id]: [createDefaultCustomItem()],
          },
          activeSection: section.id,
        });
      },

      updateCustomData: (sectionId, items) => {
        const { activeResumeId } = get();
        if (activeResumeId) {
          const currentResume = get().resumes[activeResumeId];
          const updatedCustomData = {
            ...currentResume.customData,
            [sectionId]: items,
          };
          get().updateResume(activeResumeId, { customData: updatedCustomData });
        }
      },

      removeCustomData: (sectionId) => {
        const { activeResumeId } = get();
        if (activeResumeId) {
          const currentResume = get().resumes[activeResumeId];
          const { [sectionId]: _, ...rest } = currentResume.customData;
          get().updateResume(activeResumeId, { customData: rest });
        }
      },

      addCustomItem: (sectionId) => {
        const { activeResumeId } = get();
        if (activeResumeId) {
          const currentResume = get().resumes[activeResumeId];
          const updatedCustomData = {
            ...currentResume.customData,
            [sectionId]: [
              ...(currentResume.customData[sectionId] || []),
              createDefaultCustomItem(),
            ],
          };
          get().updateResume(activeResumeId, { customData: updatedCustomData });
        }
      },

      updateCustomItem: (sectionId, itemId, updates) => {
        const { activeResumeId } = get();
        if (activeResumeId) {
          const currentResume = get().resumes[activeResumeId];
          const updatedCustomData = {
            ...currentResume.customData,
            [sectionId]: currentResume.customData[sectionId].map((item) =>
              item.id === itemId ? { ...item, ...updates } : item
            ),
          };
          get().updateResume(activeResumeId, { customData: updatedCustomData });
        }
      },

      removeCustomItem: (sectionId, itemId) => {
        const { activeResumeId } = get();
        if (activeResumeId) {
          const currentResume = get().resumes[activeResumeId];
          const updatedCustomData = {
            ...currentResume.customData,
            [sectionId]: currentResume.customData[sectionId].filter(
              (item) => item.id !== itemId
            ),
          };
          get().updateResume(activeResumeId, { customData: updatedCustomData });
        }
      },

      addCertificate: (certificate) => {
        const { activeResumeId, resumes } = get();
        if (!activeResumeId) return;

        const currentResume = resumes[activeResumeId];
        const newCertificates = currentResume.certificates.some(
          (c) => c.id === certificate.id
        )
          ? currentResume.certificates.map((c) =>
              c.id === certificate.id ? certificate : c
            )
          : [...currentResume.certificates, certificate];

        get().updateResume(activeResumeId, { certificates: newCertificates });
      },

      updateCertificate: (id, updates) => {
        const { activeResumeId, resumes } = get();
        if (!activeResumeId) return;

        const currentResume = resumes[activeResumeId];
        const newCertificates = currentResume.certificates.map((c) =>
          c.id === id ? { ...c, ...updates } : c
        );

        get().updateResume(activeResumeId, { certificates: newCertificates });
      },

      updateCertificatesBatch: (certificates) => {
        const { activeResumeId } = get();
        if (activeResumeId) {
          get().updateResume(activeResumeId, { certificates });
        }
      },

      removeCertificate: (id) => {
        const { activeResumeId, resumes } = get();
        if (!activeResumeId) return;

        const currentResume = resumes[activeResumeId];
        const updatedCertificates = currentResume.certificates.filter(
          (c) => c.id !== id
        );

        get().updateResume(activeResumeId, { certificates: updatedCertificates });
      },

      updateGlobalSettings: (settings: Partial<GlobalSettings>) => {
        const { activeResumeId, updateResume, activeResume } = get();
        if (activeResumeId) {
          updateResume(activeResumeId, {
            globalSettings: {
              ...activeResume?.globalSettings,
              ...settings,
            },
          });
        }
      },

      setThemeColor: (color) => {
        const { activeResumeId, updateResume } = get();
        if (activeResumeId) {
          updateResume(activeResumeId, {
            globalSettings: {
              ...get().activeResume?.globalSettings,
              themeColor: color,
            },
          });
        }
      },

      setTemplate: (templateId) => {
        const { activeResumeId, resumes } = get();
        if (!activeResumeId) return;

        const template = DEFAULT_TEMPLATES.find((t) => t.id === templateId);
        if (!template) return;

        get().updateResume(activeResumeId, {
          templateId,
          globalSettings: {
            ...resumes[activeResumeId].globalSettings,
            themeColor: template.colorScheme.primary,
            sectionSpacing: template.spacing.sectionGap,
            paragraphSpacing: template.spacing.itemGap,
            pagePadding: template.spacing.contentPadding,
          },
          basic: {
            ...resumes[activeResumeId].basic,
            layout: template.basic.layout,
          },
        });
      },
      addResume: (resume: ResumeData) => {
        set((state) => ({
          resumes: {
            ...state.resumes,
            [resume.id]: resume,
          },
          activeResumeId: resume.id,
          activeResume: resume,
          history: {
            ...state.history,
            [resume.id]: [],
          },
          future: {
            ...state.future,
            [resume.id]: [],
          },
        }));

        syncResumeToFile(resume);
        return resume.id;
      },
    }),
    {
      name: "resume-storage",
      storage: createJSONStorage<PersistedResumeStore>(() =>
        createSafeLocalStorage()
      ),
      partialize: (state): PersistedResumeStore => ({
        resumes: state.resumes,
        activeResumeId: state.activeResumeId,
      }),
      merge: (persistedState, currentState) => {
        const persisted = persistedState as Partial<PersistedResumeStore>;
        const resumes = persisted.resumes ?? currentState.resumes;
        const activeResumeId =
          persisted.activeResumeId ?? currentState.activeResumeId;

        return {
          ...currentState,
          ...persisted,
          resumes,
          activeResumeId,
          activeResume: activeResumeId ? resumes[activeResumeId] ?? null : null,
        };
      },
    }
  )
);
