import { useCallback } from "react";
import { useLocale } from "@/i18n/compat/client";
import { locales, localeNames, type Locale } from "@/i18n/config";
import { getLocaleFromPathname, replacePathLocale } from "@/i18n/runtime";
import { useLocation, useNavigate, useRouter } from "@tanstack/react-router";

export const LOCALE_CHANGE_EVENT = "app:locale-change";

export function dispatchLocaleChange(nextLocale: Locale) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent<Locale>(LOCALE_CHANGE_EVENT, { detail: nextLocale })
    );
  }
}

/**
 * 统一的国际化语言切换 Hook
 * 抽离了 Cookie 写入、事件广播、路径重写和 TanStack Router 同步逻辑
 */
export function useLocaleSwitch() {
  const locale = useLocale();
  const navigate = useNavigate();
  const router = useRouter();
  const pathname = useLocation({
    select: (location) => location.pathname,
  });

  const switchLocale = useCallback(
    (nextLocale: Locale) => {
      if (typeof document !== "undefined") {
        document.cookie = `NEXT_LOCALE=${nextLocale}; path=/; max-age=31536000; SameSite=Lax`;
      }

      dispatchLocaleChange(nextLocale);

      const currentPathLocale = getLocaleFromPathname(pathname);
      if (currentPathLocale) {
        if (pathname === `/${currentPathLocale}` || pathname === `/${currentPathLocale}/`) {
          navigate({ to: "/$locale", params: { locale: nextLocale } });
        } else {
          navigate({ to: replacePathLocale(pathname, nextLocale) as any });
        }
      } else {
        router.invalidate();
      }
    },
    [navigate, pathname, router]
  );

  const toggleLocale = useCallback(() => {
    const nextLocale: Locale = locale === "zh" ? "en" : "zh";
    switchLocale(nextLocale);
  }, [locale, switchLocale]);

  return {
    locale,
    locales,
    localeNames,
    switchLocale,
    toggleLocale,
  };
}
