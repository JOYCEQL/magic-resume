import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/app/")({
  beforeLoad: () => {
    throw redirect({ to: "/app/dashboard/resumes" });
  }
});
