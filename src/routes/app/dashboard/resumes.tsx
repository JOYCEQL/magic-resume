import { createFileRoute } from "@tanstack/react-router";
import ResumesPage from "@/components/dashboard/ResumesPage";

export const Route = createFileRoute("/app/dashboard/resumes")({
  component: ResumesPage,
});
