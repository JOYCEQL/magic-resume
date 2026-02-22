"use client";

import { useNavigate } from "@tanstack/react-router";

export default function GoDashboard({
  children,
  type = "dashboard",
}: {
  children: React.ReactNode;
  type?: "dashboard" | "templates" | "resumes";
}) {
  const navigate = useNavigate();

  const routeMap = {
    dashboard: "/app/dashboard",
    resumes: "/app/dashboard/resumes",
    templates: "/app/dashboard/templates"
  };

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        navigate({ to: routeMap[type] });
      }}
    >
      {children}
    </form>
  );
}
