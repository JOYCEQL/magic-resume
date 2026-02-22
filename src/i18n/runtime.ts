import { defaultLocale, locales, Locale } from "./config";

const localeSet = new Set(locales);

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

export function getPreferredLocale(pathname: string): Locale {
  const localeFromPath = getLocaleFromPathname(pathname);
  if (localeFromPath) {
    return localeFromPath;
  }

  if (typeof document !== "undefined") {
    const cookieLocale = document.cookie
      .split("; ")
      .find((row) => row.startsWith("NEXT_LOCALE="))
      ?.split("=")[1];

    if (cookieLocale && isSupportedLocale(cookieLocale)) {
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
