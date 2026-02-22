import { createFileRoute } from "@tanstack/react-router";
import TemplatesPage from "@/app/app/dashboard/templates/page";

export const Route = createFileRoute("/app/dashboard/templates")({
  component: TemplatesPage
});
