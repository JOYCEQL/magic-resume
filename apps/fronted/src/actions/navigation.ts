"use server";

import { redirect } from "next/navigation";

export async function GoDashboardAction() {
  redirect("/app/dashboard");
}
