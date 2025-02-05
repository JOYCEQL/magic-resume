"use client";

import {
  GoDashboardAction,
  GoTemplatesAction,
  GoResumesAction,
} from "@/actions/navigation";

export default function GoDashboard({
  children,
  type = "dashboard",
}: {
  children: React.ReactNode;
  type?: "dashboard" | "templates" | "resumes";
}) {
  const actionMap = {
    dashboard: GoDashboardAction,
    resumes: GoResumesAction,
    templates: GoTemplatesAction,
  };

  return <form action={actionMap[type]}>{children}</form>;
}
