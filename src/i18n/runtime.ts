import { defaultLocale, locales, Locale } from "./config";

const localeSet = new Set(locales);

export const LOCALE_COOKIE_NAME = "NEXT_LOCALE";
const LOCALE_COOKIE_MAX_AGE = 31536000;

export function isSupportedLocale(value: string): value is Locale {
  return localeSet.has(value as Locale);
}

export function getLocaleFromPathname(pathname: string): Locale | null {
  const firstSegment = pathname.split("/").filter(Boolean)[0];
  if (!firstSegment) {
    return null;
  }
  return isSupportedLocale(firstSegment) ? firstSegment : null;
}

export function parseCookieLocale(cookieHeader?: string): Locale | null {
  if (!cookieHeader) {
    return null;
  }

  const cookieLocale = cookieHeader
    .split("; ")
    .find((row) => row.startsWith(`${LOCALE_COOKIE_NAME}=`))
    ?.split("=")[1];

  return cookieLocale && isSupportedLocale(cookieLocale) ? cookieLocale : null;
}

export function getCookieLocale(): Locale {
  if (typeof document === "undefined") {
    return defaultLocale;
  }

  return parseCookieLocale(document.cookie) ?? defaultLocale;
}

export function setCookieLocale(locale: Locale): void {
  if (typeof document === "undefined") {
    return;
  }

  document.cookie = `${LOCALE_COOKIE_NAME}=${locale}; path=/; max-age=${LOCALE_COOKIE_MAX_AGE}`;
}

export function getPreferredLocale(pathname: string): Locale {
  const localeFromPath = getLocaleFromPathname(pathname);
  if (localeFromPath) {
    return localeFromPath;
  }

  if (typeof document !== "undefined") {
    const cookieLocale = parseCookieLocale(document.cookie);
    if (cookieLocale) {
      return cookieLocale;
    }
  }

  return defaultLocale;
}

export function replacePathLocale(pathname: string, locale: Locale): string {
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length > 0 && isSupportedLocale(segments[0])) {
    segments[0] = locale;
    return `/${segments.join("/")}`;
  }

  return `/${locale}`;
}
