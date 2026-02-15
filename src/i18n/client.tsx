import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  type ReactNode
} from "react";
import { defaultLocale, type Locale } from "@/i18n/config";
import {
  getMessagesByLocale,
  normalizeLocale,
  type LocaleMessages
} from "@/i18n/messages";
import { persistLocale } from "@/i18n/runtime";

type TranslationValues = Record<string, string | number | boolean | null | undefined>;

type TranslateFn = ((key: string, values?: TranslationValues) => string) & {
  raw: (key: string) => unknown;
};

type I18nContextValue = {
  locale: Locale;
  messages: LocaleMessages;
};

const I18nContext = createContext<I18nContextValue>({
  locale: defaultLocale,
  messages: getMessagesByLocale(defaultLocale)
});

function getNestedValue(value: unknown, key: string): unknown {
  if (!key) {
    return value;
  }

  return key.split(".").reduce<unknown>((acc, segment) => {
    if (acc === null || typeof acc !== "object") {
      return undefined;
    }

    return (acc as Record<string, unknown>)[segment];
  }, value);
}

function interpolate(template: string, values?: TranslationValues): string {
  if (!values) {
    return template;
  }

  return template.replace(/\{(\w+)\}/g, (_, key) => {
    const value = values[key];
    return value === undefined || value === null ? "" : String(value);
  });
}

function createTranslator(messages: LocaleMessages, namespace?: string): TranslateFn {
  const base = namespace ? getNestedValue(messages, namespace) : messages;

  const translate = ((key: string, values?: TranslationValues) => {
    const value = getNestedValue(base, key);

    if (typeof value === "string") {
      return interpolate(value, values);
    }

    if (typeof value === "number" || typeof value === "boolean") {
      return String(value);
    }

    return key;
  }) as TranslateFn;

  translate.raw = (key: string) => getNestedValue(base, key);

  return translate;
}

export function NextIntlClientProvider({
  children,
  locale,
  messages
}: {
  children: ReactNode;
  locale?: string;
  messages?: LocaleMessages;
}) {
  const normalizedLocale = normalizeLocale(locale);
  const resolvedMessages = messages ?? getMessagesByLocale(normalizedLocale);

  useEffect(() => {
    persistLocale(normalizedLocale);
  }, [normalizedLocale]);

  const value = useMemo<I18nContextValue>(
    () => ({
      locale: normalizedLocale,
      messages: resolvedMessages
    }),
    [normalizedLocale, resolvedMessages]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useLocale(): Locale {
  return useContext(I18nContext).locale;
}

export function useTranslations(namespace?: string): TranslateFn {
  const { messages } = useContext(I18nContext);

  return useMemo(() => createTranslator(messages, namespace), [messages, namespace]);
}
