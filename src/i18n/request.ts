import { getRequestConfig } from "next-intl/server";
import { defaultLocale, locales } from "./config";
import { getUserLocale } from "./db";

export default getRequestConfig(async ({ requestLocale }) => {
  // Read from potential `[locale]` segment
  let locale = await requestLocale;

  if (!locale) {
    // The user is logged in
    locale = await getUserLocale();
  }

  // Ensure that the incoming locale is valid
  if (!locales.includes(locale as any)) {
    locale = defaultLocale;
  }

  return {
    locale,
    messages: (await import(`./locales/${locale}.json`)).default,
  };
});
