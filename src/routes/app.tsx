import { Outlet, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/app")({
  head: () => ({
    meta: [
      {
        name: "robots",
        content: "noindex,nofollow"
      }
    ]
  }),
  component: AppRoute
});

function AppRoute() {
  return <Outlet />;
}
