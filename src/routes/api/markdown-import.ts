import { createFileRoute } from "@tanstack/react-router";
import { handleMarkdownImport } from "@/lib/server/resume-import";

export const Route = createFileRoute("/api/markdown-import")({
  server: {
    handlers: {
      POST: ({ request }) => handleMarkdownImport(request),
    },
  },
});
