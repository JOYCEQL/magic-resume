import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/app/dashboard/")({
  beforeLoad: () => {
    throw redirect({
      to: "/app/dashboard/resumes"
    });
  }
});
