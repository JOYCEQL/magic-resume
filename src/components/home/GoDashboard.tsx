import { Link } from "@tanstack/react-router";
import {
  DASHBOARD_PATH,
  RESUMES_PATH,
  TEMPLATES_PATH,
} from "@/actions/navigation";

export default function GoDashboard({
  children,
  type = "dashboard",
}: {
  children: React.ReactNode;
  type?: "dashboard" | "templates" | "resumes";
}) {
  const pathMap = {
    dashboard: DASHBOARD_PATH,
    resumes: RESUMES_PATH,
    templates: TEMPLATES_PATH,
  };

  return <Link to={pathMap[type]}>{children}</Link>;
}
