"use server";
import { setUserLocale } from "@/i18n/db";
import { revalidatePath } from "next/cache";
export default async function updateLocale(locale: string) {
  setUserLocale(locale);
  revalidatePath("/");
}
