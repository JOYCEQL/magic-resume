import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import WorkbenchPage from "@/app/app/workbench/[id]/page";
import { useResumeStore } from "@/store/useResumeStore";
import { preloadFontFamily } from "@/utils/fonts";
import { loadRichTextEditor } from "@/lib/loadRichTextEditor";
import { useTranslations } from "@/i18n/compat/client";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/app/workbench/$id")({
  head: () => ({
    meta: [{ name: "robots", content: "noindex,nofollow" }]
  }),
  ssr: false,
  loader: async () => {
    await loadRichTextEditor();
  },
  pendingMs: 0,
  pendingMinMs: 0,
  pendingComponent: WorkbenchLoading,
  errorComponent: WorkbenchLoadError,
  component: WorkbenchRoutePage
});

function WorkbenchLoading() {
  const t = useTranslations();
  return <div role="status" className="min-h-dvh flex items-center justify-center text-muted-foreground">{t("common.editorLoading")}</div>;
}

function WorkbenchLoadError() {
  const t = useTranslations();
  return (
    <div role="alert" className="min-h-dvh flex flex-col gap-4 items-center justify-center p-6 text-center">
      <p>{t("common.editorLoadFailed")}</p>
      <Button onClick={() => window.location.reload()}>{t("common.reloadEditor")}</Button>
    </div>
  );
}

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
