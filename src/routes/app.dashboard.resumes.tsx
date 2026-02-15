import { createFileRoute } from "@tanstack/react-router";
import ResumesPage from "@/app/app/dashboard/resumes/page";

export const Route = createFileRoute("/app/dashboard/resumes")({
  component: ResumesPage
});
