"use client";

import { useRouter } from "next/navigation";

export default function GoDashboard({
  children,
  type = "dashboard"
}: {
  children: React.ReactNode;
  type?: "dashboard" | "templates" | "resumes";
}) {
  const router = useRouter();

  const pathMap: Record<typeof type, string> = {
    dashboard: "/app/dashboard",
    resumes: "/app/dashboard/resumes",
    templates: "/app/dashboard/templates"
  };

  return (
    <div
      className="contents cursor-pointer"
      onClick={() => {
        router.push(pathMap[type]);
      }}
    >
      {children}
    </div>
  );
}
