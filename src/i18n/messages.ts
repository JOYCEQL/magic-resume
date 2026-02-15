import type { Locale } from "@/i18n/config";
import { defaultLocale, locales } from "@/i18n/config";
import en from "@/i18n/locales/en.json";
import zh from "@/i18n/locales/zh.json";

const localeMessages = {
  en,
  zh
} as const;

export type LocaleMessages = (typeof localeMessages)[Locale];

export function isSupportedLocale(locale: string): locale is Locale {
  return locales.includes(locale as Locale);
}

export function getMessagesByLocale(locale: string): LocaleMessages {
  if (isSupportedLocale(locale)) {
    return localeMessages[locale];
  }
  return localeMessages[defaultLocale];
}

export function normalizeLocale(locale?: string | null): Locale {
  if (locale && isSupportedLocale(locale)) {
    return locale;
  }
  return defaultLocale;
}
