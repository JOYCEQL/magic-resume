import { createFileRoute } from "@tanstack/react-router";
import AISettingsPage from "@/components/dashboard/AISettingsPage";

export const Route = createFileRoute("/app/dashboard/ai")({
  component: AISettingsPage,
});
