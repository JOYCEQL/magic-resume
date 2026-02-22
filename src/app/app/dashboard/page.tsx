import { redirect } from "@/lib/navigation";

export const runtime = "edge";

export default function Dashboard() {
  redirect("/app/dashboard/resumes");
}
