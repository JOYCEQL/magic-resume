import { createFileRoute, Outlet } from "@tanstack/react-router";
import DashboardLayout from "@/components/dashboard/DashboardLayout";

export const Route = createFileRoute("/app/dashboard")({
  component: DashboardRoute,
  head: () => ({
    meta: [{ title: "MagicV - Dashboard" }],
  }),
});

function DashboardRoute() {
  return (
    <DashboardLayout>
      <Outlet />
    </DashboardLayout>
  );
}
