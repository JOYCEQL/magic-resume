import { createFileRoute } from "@tanstack/react-router";
import { handleTextRequest } from "@/lib/server/ai-text";

export const Route = createFileRoute("/api/grammar")({
  server: { handlers: { POST: ({ request }) => handleTextRequest(request, "grammar") } },
});
