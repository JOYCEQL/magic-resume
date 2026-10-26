import { createFileRoute } from "@tanstack/react-router";
import { handleOrcaExchange } from "@/lib/server/orcarouter-auth";

export const Route = createFileRoute("/api/orcarouter/exchange")({
  server: { handlers: { POST: ({ request }) => handleOrcaExchange(request) } },
});
