import { createFileRoute } from "@tanstack/react-router";
import TemplatesPage from "@/components/dashboard/TemplatesPage";

export const Route = createFileRoute("/app/dashboard/templates")({
  component: TemplatesPage,
});
