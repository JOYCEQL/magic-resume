export const locales = ["zh", "en", "ru"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "zh";

export const localeNames: Record<Locale, string> = {
  zh: "中文",
  en: "English",
  ru: "Русский",
};

export const localeTags: Record<Locale, string> = {
  zh: "zh_CN",
  en: "en_US",
  ru: "ru_RU",
};

export const heroUiLocales: Record<Locale, string> = {
  zh: "zh-CN",
  en: "en-US",
  ru: "ru-RU",
};

export const importLanguages: Record<Locale, string> = {
  zh: "Chinese",
  en: "English",
  ru: "Russian",
};
