import { createFileRoute } from "@tanstack/react-router";
import { handleResumeImport } from "@/lib/server/resume-import";

export const Route = createFileRoute("/api/resume-import")({
  server: {
    handlers: {
      POST: ({ request }) => handleResumeImport(request),
    },
  },
});
