import { createFileRoute, Outlet } from "@tanstack/react-router";
import DashboardLayout from "@/app/app/dashboard/client";

export const Route = createFileRoute("/app/dashboard")({
  head: () => ({
    meta: [{ name: "robots", content: "noindex,nofollow" }]
  }),
  ssr: false,
  component: DashboardRouteLayout
});

function DashboardRouteLayout() {
  return (
    <DashboardLayout>
      <Outlet />
    </DashboardLayout>
  );
}
