import { defaultLocale, type Locale } from "@/i18n/config";
import { isSupportedLocale, normalizeLocale } from "@/i18n/messages";

export const LOCALE_COOKIE_NAME = "NEXT_LOCALE";
export const LOCALE_STORAGE_KEY = "magic-resume-locale";

function safelyReadCookie(name: string): string | undefined {
  if (typeof document === "undefined") {
    return undefined;
  }

  const cookieItem = document.cookie
    .split(";")
    .map((item) => item.trim())
    .find((item) => item.startsWith(`${name}=`));

  if (!cookieItem) {
    return undefined;
  }

  return decodeURIComponent(cookieItem.slice(name.length + 1));
}

function safelyReadStorage(name: string): string | undefined {
  if (typeof window === "undefined") {
    return undefined;
  }

  try {
    return window.localStorage.getItem(name) ?? undefined;
  } catch {
    return undefined;
  }
}

export function persistLocale(locale: string) {
  if (!isSupportedLocale(locale)) {
    return;
  }

  if (typeof document !== "undefined") {
    document.cookie = `${LOCALE_COOKIE_NAME}=${encodeURIComponent(locale)}; Path=/; Max-Age=31536000; SameSite=Lax`;
  }

  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
    } catch {
      // ignore storage errors
    }
  }
}

export function getLocaleFromPath(pathname: string): Locale | undefined {
  const segment = pathname.split("/").filter(Boolean)[0];
  if (segment && isSupportedLocale(segment)) {
    return segment;
  }
  return undefined;
}

export function resolveLocale(pathname: string): Locale {
  return (
    getLocaleFromPath(pathname) ??
    normalizeLocale(safelyReadCookie(LOCALE_COOKIE_NAME)) ??
    normalizeLocale(safelyReadStorage(LOCALE_STORAGE_KEY)) ??
    defaultLocale
  );
}

export function withLocale(pathname: string, locale: string): string {
  const normalizedLocale = normalizeLocale(locale);
  const normalizedPathname = pathname.startsWith("/") ? pathname : `/${pathname}`;

  if (normalizedPathname === "/") {
    return `/${normalizedLocale}`;
  }

  const segments = normalizedPathname.split("/").filter(Boolean);

  if (segments.length > 0 && isSupportedLocale(segments[0])) {
    segments[0] = normalizedLocale;
    return `/${segments.join("/")}`;
  }

  // 保持应用内路由无 locale 前缀，切换语言仅更新偏好
  if (normalizedPathname.startsWith("/app") || normalizedPathname.startsWith("/api")) {
    return normalizedPathname;
  }

  return `/${normalizedLocale}${normalizedPathname}`;
}
