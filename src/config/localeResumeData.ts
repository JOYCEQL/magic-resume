import type { Locale } from "@/i18n/config";
import { defaultLocale } from "@/i18n/config";
import { getMessagesForLocale } from "@/i18n/messages";
import { getCookieLocale as readCookieLocale } from "@/i18n/runtime";
import {
  blankResumeState,
  blankResumeStateEn,
  blankResumeStateRu,
  initialResumeState,
  initialResumeStateEn,
  initialResumeStateRu,
} from "./initialResumeData";

type ResumeTemplateState = typeof initialResumeState;

const INITIAL_RESUME_BY_LOCALE: Record<Locale, ResumeTemplateState> = {
  zh: initialResumeState,
  en: initialResumeStateEn,
  ru: initialResumeStateRu,
};

const BLANK_RESUME_BY_LOCALE: Record<Locale, ResumeTemplateState> = {
  zh: blankResumeState,
  en: blankResumeStateEn,
  ru: blankResumeStateRu,
};

export function getCookieLocale(): Locale {
  return readCookieLocale();
}

export function getInitialResumeStateForLocale(locale: Locale): ResumeTemplateState {
  return INITIAL_RESUME_BY_LOCALE[locale] ?? INITIAL_RESUME_BY_LOCALE[defaultLocale];
}

export function getBlankResumeStateForLocale(locale: Locale): ResumeTemplateState {
  return BLANK_RESUME_BY_LOCALE[locale] ?? BLANK_RESUME_BY_LOCALE[defaultLocale];
}

export function getLocalizedCommonLabel(
  locale: Locale,
  key: "newResume" | "copy"
): string {
  const messages = getMessagesForLocale(locale) as {
    common: Record<string, string>;
  };

  return messages.common[key] ?? key;
}
