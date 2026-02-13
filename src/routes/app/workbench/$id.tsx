import { createFileRoute } from "@tanstack/react-router";
import WorkbenchPage from "@/components/workbench/WorkbenchPage";

export const Route = createFileRoute("/app/workbench/$id")({
  component: WorkbenchPage,
});
