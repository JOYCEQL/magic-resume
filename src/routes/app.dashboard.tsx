import { Outlet, createFileRoute } from "@tanstack/react-router";
import DashboardLayout from "@/app/app/dashboard/client";

export const Route = createFileRoute("/app/dashboard")({
  component: DashboardRoute
});

function DashboardRoute() {
  return (
    <DashboardLayout>
      <Outlet />
    </DashboardLayout>
  );
}
