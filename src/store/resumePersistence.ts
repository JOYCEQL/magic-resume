import type { PersistStorage, StorageValue } from "zustand/middleware";

export const RESUME_STORAGE_KEY = "resume-storage";
export const RESUME_INDEX_KEY = "magic-resume-index";
export const RESUME_DOC_PREFIX = "magic-resume-doc:";

type LocalStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;
type ResumeState<T> = { resumes: Record<string, T>; activeResumeId: string | null };
type Index = { ids: string[]; activeResumeId: string | null; version: number };

/** A failed write must never advance the committed snapshot or discard a retry. */
export function createResumePersistence<T>({
  getStorage,
  onError,
  debounceMs = 200,
}: {
  getStorage: () => LocalStorage | undefined;
  onError: (key: string, error: unknown) => void;
  debounceMs?: number;
}) {
  let committed: Record<string, T> = {};
  let index: Index = { ids: [], activeResumeId: null, version: 0 };
  let knownIds = new Set<string>();
  let legacyMode = false;
  let pending: StorageValue<ResumeState<T>> | null = null;
  let timer: ReturnType<typeof setTimeout> | undefined;

  const cancelTimer = () => {
    clearTimeout(timer);
    timer = undefined;
  };
  const attempt = (key: string, operation: () => void) => {
    try {
      operation();
      return true;
    } catch (error) {
      onError(key, error);
      return false;
    }
  };
  const indexFor = (value: StorageValue<ResumeState<T>>): Index => ({
    ids: Object.keys(value.state.resumes),
    activeResumeId: value.state.activeResumeId,
    version: value.version ?? 0,
  });

  const flush = (): boolean => {
    cancelTimer();
    if (!pending) return true;
    const value = pending;
    let success = true;
    const completed = attempt(RESUME_STORAGE_KEY, () => {
      const local = getStorage();
      if (!local) {
        success = false;
        return;
      }
      if (legacyMode) {
        // When migration cannot fit alongside the original, keep saving the
        // original atomically. A later visit can retry the migration.
        local.setItem(RESUME_STORAGE_KEY, JSON.stringify(value));
        return;
      }
      const nextIndex = indexFor(value);
      const writeIndex = (next: Index) => {
        if (JSON.stringify(index) === JSON.stringify(next)) return true;
        return attempt(RESUME_INDEX_KEY, () => {
          local.setItem(RESUME_INDEX_KEY, JSON.stringify(next));
          index = next;
        });
      };

      // Publish deletions before reclaiming their documents. This both avoids
      // dangling references and frees quota for previously failed edits.
      const retainedIds = index.ids.filter(id => id in value.state.resumes);
      if (retainedIds.length !== index.ids.length && !writeIndex({
        ...index,
        ids: retainedIds,
        activeResumeId: retainedIds.includes(index.activeResumeId ?? "")
          ? index.activeResumeId : null,
      })) {
        success = false;
        return;
      }
      for (const id of Array.from(knownIds)) {
        if (id in value.state.resumes) continue;
        if (attempt(RESUME_DOC_PREFIX + id, () => local.removeItem(RESUME_DOC_PREFIX + id))) {
          knownIds.delete(id);
          delete committed[id];
        } else {
          success = false;
        }
      }
      let documentsSaved = true;
      for (const [id, resume] of Object.entries(value.state.resumes)) {
        if (committed[id] === resume) continue;
        if (attempt(RESUME_DOC_PREFIX + id, () => {
          local.setItem(RESUME_DOC_PREFIX + id, JSON.stringify(resume));
        })) {
          committed[id] = resume;
          knownIds.add(id);
        } else {
          documentsSaved = false;
        }
      }
      // Never publish a new ID until its document has been saved successfully.
      success = documentsSaved && writeIndex(nextIndex) && success;
    });
    if (completed && success) pending = null;
    return completed && success;
  };

  const storage: PersistStorage<ResumeState<T>> = {
    getItem: () => {
      let result: StorageValue<ResumeState<T>> | null = null;
      attempt(RESUME_STORAGE_KEY, () => {
        const local = getStorage();
        if (!local) return;
        const rawLegacy = local.getItem(RESUME_STORAGE_KEY);
        if (rawLegacy) {
          const value = JSON.parse(rawLegacy) as StorageValue<ResumeState<T>>;
          if (!value.state?.resumes) throw new Error("Invalid resume storage");
          result = value;
          legacyMode = true;
          const nextIndex = indexFor(value);
          const backups = new Map<string, string | null>();
          const write = (key: string, data: string) => {
            backups.set(key, local.getItem(key));
            local.setItem(key, data);
          };
          const migrated = attempt(RESUME_STORAGE_KEY, () => {
            for (const [id, resume] of Object.entries(value.state.resumes)) {
              write(RESUME_DOC_PREFIX + id, JSON.stringify(resume));
            }
            write(RESUME_INDEX_KEY, JSON.stringify(nextIndex));
            // This is the commit point: all new data is durable before the
            // only original copy is removed.
            local.removeItem(RESUME_STORAGE_KEY);
          });
          if (!migrated) {
            // Reclaim temporary copies so the old format can still be edited.
            for (const [key, previous] of Array.from(backups)) {
              if (previous === null) attempt(key, () => local.removeItem(key));
            }
            for (const [key, previous] of Array.from(backups)) {
              if (previous !== null) attempt(key, () => local.setItem(key, previous));
            }
            return;
          }
          legacyMode = false;
          index = nextIndex;
          committed = { ...value.state.resumes };
          knownIds = new Set(index.ids);
          return;
        }
        legacyMode = false;
        const rawIndex = local.getItem(RESUME_INDEX_KEY);
        if (!rawIndex) return;
        index = JSON.parse(rawIndex) as Index;
        const resumes: Record<string, T> = {};
        for (const id of index.ids) {
          attempt(RESUME_DOC_PREFIX + id, () => {
            const raw = local.getItem(RESUME_DOC_PREFIX + id);
            if (raw) resumes[id] = JSON.parse(raw) as T;
          });
        }
        committed = { ...resumes };
        knownIds = new Set(index.ids);
        result = {
          state: { resumes, activeResumeId: index.activeResumeId },
          version: index.version,
        };
      });
      return result;
    },
    setItem: (_name, value) => {
      pending = value;
      cancelTimer();
      const next = indexFor(value);
      if (JSON.stringify(next) !== JSON.stringify(index)) {
        flush();
      } else {
        timer = setTimeout(flush, debounceMs);
      }
    },
    removeItem: () => {
      cancelTimer();
      pending = null;
      const local = getStorage();
      if (!local) return;
      local.removeItem(RESUME_STORAGE_KEY);
      local.removeItem(RESUME_INDEX_KEY);
      for (const id of Array.from(knownIds)) local.removeItem(RESUME_DOC_PREFIX + id);
      committed = {};
      knownIds.clear();
      index = { ids: [], activeResumeId: null, version: 0 };
      legacyMode = false;
    },
  };

  return { storage, flush };
}
