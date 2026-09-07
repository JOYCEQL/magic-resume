import { createFileRoute } from "@tanstack/react-router";
import { handleModelsRequest } from "@/lib/server/ai-models";

export const Route = createFileRoute("/api/models")({
  server: { handlers: { POST: ({ request }) => handleModelsRequest(request) } },
});
