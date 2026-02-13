import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/app/workbench")({
  component: WorkbenchLayout,
  head: () => ({
    meta: [{ title: "MagicV - Workbench" }],
  }),
});

function WorkbenchLayout() {
  return (
    <div className="overflow-y-hidden w-full">
      <Outlet />
    </div>
  );
}
