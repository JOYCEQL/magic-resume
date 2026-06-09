// Static imports for all locales. TODO: lazy-load per locale when locale count grows.
import { defaultLocale, type Locale } from "./config";
import zhMessages from "./locales/zh.json";
import enMessages from "./locales/en.json";
import ruMessages from "./locales/ru.json";

type Messages = Record<string, unknown>;

export const messagesByLocale: Record<Locale, Messages> = {
  zh: zhMessages as Messages,
  en: enMessages as Messages,
  ru: ruMessages as Messages,
};

export function getMessagesForLocale(locale: Locale): Messages {
  return messagesByLocale[locale] ?? messagesByLocale[defaultLocale];
}
