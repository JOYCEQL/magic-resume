import { createFileRoute } from "@tanstack/react-router";
import AISettingsPage from "@/app/app/dashboard/ai/page";

export const Route = createFileRoute("/app/dashboard/ai")({
  component: AISettingsPage
});
