import { useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import WorkbenchPage from "@/app/app/workbench/[id]/page";

export const Route = createFileRoute("/app/workbench/$id")({
  component: WorkbenchRoute
});

function WorkbenchRoute() {
  useEffect(() => {
    document.body.classList.add("overflow-y-hidden", "w-full");

    return () => {
      document.body.classList.remove("overflow-y-hidden", "w-full");
    };
  }, []);

  return <WorkbenchPage />;
}
