import { redirect } from "next/navigation";

export const runtime = "edge";

export default function Dashboard() {
  redirect("/app/dashboard/resumes");
}
