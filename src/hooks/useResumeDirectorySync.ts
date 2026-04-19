import { useEffect } from "react";
import { useResumeStore } from "@/store/useResumeStore";
import { syncResumesFromDirectory } from "@/utils/resumeFileSync";

let hasSyncedFromDirectory = false;
let activeSyncPromise: Promise<void> | null = null;

export const useResumeDirectorySync = () => {
  const updateResumeFromFile = useResumeStore(
    (state) => state.updateResumeFromFile
  );

  useEffect(() => {
    if (hasSyncedFromDirectory || activeSyncPromise) {
      return;
    }

    activeSyncPromise = syncResumesFromDirectory(updateResumeFromFile)
      .then(() => undefined)
      .catch((error) => {
        console.error("Error syncing resume directory:", error);
      })
      .finally(() => {
        hasSyncedFromDirectory = true;
        activeSyncPromise = null;
      });
  }, [updateResumeFromFile]);
};
