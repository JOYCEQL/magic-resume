import { createNavigation } from "@/i18n/compat/navigation";
import { defineRouting } from "@/i18n/compat/navigation";
import { defaultLocale, locales } from "./config";

export const routing = defineRouting({
  locales,
  defaultLocale,
});

export const { Link, usePathname } = createNavigation(routing);
