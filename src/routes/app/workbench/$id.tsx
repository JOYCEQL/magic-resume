import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import WorkbenchPage from "@/app/app/workbench/[id]/page";
import { useResumeStore } from "@/store/useResumeStore";
import { preloadFontFamily } from "@/utils/fonts";
import { WorkbenchSkeleton } from "@/components/skeletons/PageSkeletons";

export const Route = createFileRoute("/app/workbench/$id")({
  head: () => ({
    meta: [{ name: "robots", content: "noindex,nofollow" }]
  }),
  ssr: false,
  // Server-rendered in place of the client-only page until it mounts.
  pendingComponent: WorkbenchSkeleton,
  component: WorkbenchRoutePage
});

function WorkbenchRoutePage() {
  const { id } = Route.useParams();
  const setActiveResume = useResumeStore((state) => state.setActiveResume);
  const fontFamily = useResumeStore((state) => state.resumes[id]?.globalSettings?.fontFamily);

  useEffect(() => {
    setActiveResume(id);
  }, [id, setActiveResume]);

  useEffect(() => {
    if (!useResumeStore.getState().resumes[id]) return;
    // Also warm the selected family on direct entry and after a font change.
    // Never hold up navigation or the editing controls while it downloads.
    void preloadFontFamily(fontFamily).catch(error => {
      console.warn("Failed to preload resume font:", error);
    });
  }, [id, fontFamily]);

  return <WorkbenchPage />;
}
