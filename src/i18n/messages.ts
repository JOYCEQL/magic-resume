import type { Locale } from "./config";
import zh from "./locales/zh.json";
import en from "./locales/en.json";
import tl from "./locales/tl.json";

export const messagesByLocale: Record<Locale, typeof zh> = {
  zh,
  en,
  tl,
};

export const getMessagesForLocale = (locale: Locale) =>
  messagesByLocale[locale] ?? messagesByLocale.zh;

export const localeOgTags: Record<Locale, string> = {
  zh: "zh_CN",
  en: "en_US",
  tl: "fil_PH",
};
