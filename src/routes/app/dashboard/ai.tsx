import { createFileRoute } from "@tanstack/react-router";
import { AI_PROVIDERS } from "@/config/ai-models";
import AISettingsPage from "@/app/app/dashboard/ai/page";

export const Route = createFileRoute("/app/dashboard/ai")({
  validateSearch: (search: Record<string, unknown>) => ({
    provider: AI_PROVIDERS.find((provider) => provider === search.provider),
  }),
  component: AISettingsPage
});
