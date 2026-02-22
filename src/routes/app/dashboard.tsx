import { createFileRoute, Outlet } from "@tanstack/react-router";
import DashboardLayout from "@/app/app/dashboard/client";

export const Route = createFileRoute("/app/dashboard")({
  component: DashboardRouteLayout
});

function DashboardRouteLayout() {
  return (
    <DashboardLayout>
      <Outlet />
    </DashboardLayout>
  );
}
