import { defaultLocale, Locale } from "@/i18n/config";
import { getMessagesForLocale, messagesByLocale } from "@/i18n/messages";
import { createTranslator } from "./utils";

type Messages = Record<string, unknown>;

const MESSAGES: Record<Locale, Messages> = messagesByLocale as Record<
  Locale,
  Messages
>;

let requestLocale: Locale = defaultLocale;

export function setRequestLocale(locale: Locale) {
  requestLocale = locale;
}

export async function getLocale() {
  return requestLocale;
}

export async function getMessages({ locale }: { locale?: Locale } = {}) {
  return MESSAGES[locale ?? requestLocale] ?? MESSAGES[defaultLocale];
}

export async function getTranslations({
  locale,
  namespace
}: {
  locale?: Locale;
  namespace?: string;
} = {}) {
  const messages = await getMessages({ locale });
  return createTranslator(messages, namespace);
}

export function getRequestConfig<TArgs, TResult>(
  callback: (args: TArgs) => TResult | Promise<TResult>
) {
  return callback;
}

