"use server";

import { redirect } from "next/navigation";

export async function GoDashboardAction() {
  redirect("/app/dashboard");
}
export async function GoResumesAction() {
  redirect("/app/dashboard/resumes");
}
export async function GoTemplatesAction() {
  redirect("/app/dashboard/templates");
}
