import { createFileRoute } from "@tanstack/react-router";
import SettingsPage from "@/components/dashboard/SettingsPage";

export const Route = createFileRoute("/app/dashboard/settings")({
  component: SettingsPage,
});
