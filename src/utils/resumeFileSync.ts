import type { ResumeData } from "@/types/resume";
import { getFileHandle, verifyPermission } from "@/utils/fileSystem";

type SyncResult = {
  synced: number;
  skipped: number;
  failed: number;
};

const isResumeData = (value: unknown): value is ResumeData => {
  if (!value || typeof value !== "object") {
    return false;
  }

  const resume = value as Partial<ResumeData>;
  return typeof resume.id === "string" && resume.id.length > 0;
};

export const syncResumesFromDirectory = async (
  updateResumeFromFile: (
    resume: ResumeData,
    sourceModifiedAt?: number
  ) => boolean
): Promise<SyncResult> => {
  const result: SyncResult = {
    synced: 0,
    skipped: 0,
    failed: 0,
  };

  if (typeof window === "undefined" || typeof indexedDB === "undefined") {
    return result;
  }

  try {
    const handle = await getFileHandle("syncDirectory");
    if (!handle || handle.kind !== "directory") {
      return result;
    }

    const hasPermission = await verifyPermission(handle, "read");
    if (!hasPermission) {
      return result;
    }

    const dirHandle = handle as FileSystemDirectoryHandle;
    const entries = (dirHandle as any).values?.();
    if (!entries) {
      return result;
    }

    for await (const entry of entries) {
      if (entry.kind !== "file" || !entry.name.endsWith(".json")) {
        result.skipped += 1;
        continue;
      }

      try {
        const file = await entry.getFile();
        const content = await file.text();
        const resumeData = JSON.parse(content);

        if (!isResumeData(resumeData)) {
          result.skipped += 1;
          continue;
        }

        const imported = updateResumeFromFile(resumeData, file.lastModified);
        if (imported) {
          result.synced += 1;
        } else {
          result.skipped += 1;
        }
      } catch (error) {
        result.failed += 1;
        console.error(`Error reading resume file "${entry.name}":`, error);
      }
    }
  } catch (error) {
    console.error("Error syncing resumes from files:", error);
  }

  return result;
};
