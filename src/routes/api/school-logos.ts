import { createFileRoute } from "@tanstack/react-router";
import { handleSchoolLogoSearch } from "@/lib/server/school-logos";

export const Route = createFileRoute("/api/school-logos")({
  server: { handlers: { GET: ({ request }) => handleSchoolLogoSearch(request) } },
});
