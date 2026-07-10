import type { Locale } from "@/i18n/config";
import {
  blankResumeState,
  blankResumeStateEn,
  blankResumeStateTl,
  initialResumeState,
  initialResumeStateEn,
  initialResumeStateTl,
} from "@/config/initialResumeData";

export const initialResumeByLocale = {
  zh: initialResumeState,
  en: initialResumeStateEn,
  tl: initialResumeStateTl,
} as const;

export const blankResumeByLocale = {
  zh: blankResumeState,
  en: blankResumeStateEn,
  tl: blankResumeStateTl,
} as const;

export const defaultResumeTitleByLocale: Record<Locale, string> = {
  zh: "新建简历",
  en: "New Resume",
  tl: "Bagong Resume",
};

export const copyLabelByLocale: Record<Locale, string> = {
  zh: "复制",
  en: "Copy",
  tl: "Kopyahin",
};

export const resolveLocaleFromCookie = (cookieValue?: string): Locale => {
  if (cookieValue === "en" || cookieValue === "tl" || cookieValue === "zh") {
    return cookieValue;
  }
  return "zh";
};
