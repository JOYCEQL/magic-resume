import { createFileRoute, Outlet } from "@tanstack/react-router";
import DashboardLayout from "@/app/app/dashboard/client";
import { useEffect } from "react";
import { preloadRichTextEditor } from "@/lib/loadRichTextEditor";

export const Route = createFileRoute("/app/dashboard")({
  head: () => ({
    meta: [{ name: "robots", content: "noindex,nofollow" }]
  }),
  ssr: false,
  component: DashboardRouteLayout
});

function DashboardRouteLayout() {
  useEffect(() => {
    preloadRichTextEditor();
  }, []);

  return (
    <DashboardLayout>
      <Outlet />
    </DashboardLayout>
  );
}
