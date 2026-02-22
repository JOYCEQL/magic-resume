import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import WorkbenchPage from "@/app/app/workbench/[id]/page";
import { useResumeStore } from "@/store/useResumeStore";

export const Route = createFileRoute("/app/workbench/$id")({
  head: () => ({
    meta: [{ name: "robots", content: "noindex,nofollow" }]
  }),
  ssr: false,
  component: WorkbenchRoutePage
});

function WorkbenchRoutePage() {
  const { id } = Route.useParams();
  const setActiveResume = useResumeStore((state) => state.setActiveResume);

  useEffect(() => {
    setActiveResume(id);
  }, [id, setActiveResume]);

  return <WorkbenchPage />;
}
