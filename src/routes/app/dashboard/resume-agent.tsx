import { createFileRoute } from "@tanstack/react-router";
import ResumeAgentPage from "@/app/app/dashboard/resume-agent/page";

export const Route = createFileRoute("/app/dashboard/resume-agent")({
  component: ResumeAgentPage,
});
