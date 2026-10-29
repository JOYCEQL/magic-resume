import {
  createRootRoute,
  HeadContent,
  Outlet,
  Scripts,
  useLocation,
} from "@tanstack/react-router";
import appCss from "../app/globals.css?url";
import landingCss from "@/components/home/landing.css?url";
import { NextIntlClientProvider } from "@/i18n/compat/client";
import { useEffect, useState } from "react";
import zhMessages from "@/i18n/locales/zh.json";
import enMessages from "@/i18n/locales/en.json";
import { Providers } from "@/app/providers";
import { getLocaleFromPathname, getPreferredLocale } from "@/i18n/runtime";
import { LOCALE_CHANGE_EVENT } from "@/hooks/useLocaleSwitch";
import type { Locale } from "@/i18n/config";
import { ReactGrab } from "@/components/dev/ReactGrab";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      {
        name: "baidu-site-verification",
        content: "codeva-us6tyoiVto",
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1, viewport-fit=cover",
      },
      { title: "Magic Resume" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      // Keep landing styles ready before client-side navigation renders the page.
      {
        rel: "stylesheet",
        href: landingCss,
      },
    ],
  }),
  component: RootComponent,
  notFoundComponent: RootNotFound,
});

function RootComponent() {
  const pathname = useLocation({
    select: (location) => location.pathname,
  });
  const landingLocale = getLocaleFromPathname(pathname);
  const isLandingPage =
    landingLocale !== null &&
    pathname.replace(/\/$/, "") === `/${landingLocale}`;

  const [locale, setLocale] = useState<Locale>(() => getPreferredLocale(pathname));

  useEffect(() => {
    const nextFromPath = getLocaleFromPathname(pathname);
    if (nextFromPath && nextFromPath !== locale) {
      setLocale(nextFromPath);
    }
  }, [pathname, locale]);

  useEffect(() => {
    const handleLocaleChange = (e: Event) => {
      const customEvent = e as CustomEvent<Locale>;
      if (customEvent.detail && (customEvent.detail === "zh" || customEvent.detail === "en")) {
        setLocale(customEvent.detail);
      }
    };
    window.addEventListener(LOCALE_CHANGE_EVENT, handleLocaleChange);
    return () => {
      window.removeEventListener(LOCALE_CHANGE_EVENT, handleLocaleChange);
    };
  }, []);

  const messages = locale === "en" ? enMessages : zhMessages;

  useEffect(() => {
    document.cookie = `NEXT_LOCALE=${locale}; path=/; max-age=31536000; SameSite=Lax`;
  }, [locale]);

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <HeadContent />
        <link rel="icon" href="/favicon.ico?v=2" />
        <link rel="icon" href="/icon.png" />
      </head>
      <body>
        <NextIntlClientProvider
          locale={locale}
          messages={messages}
          timeZone="Asia/Shanghai"
        >
          <Providers forcedTheme={isLandingPage ? "light" : undefined}>
            <ReactGrab />
            <Outlet />
          </Providers>
        </NextIntlClientProvider>
        <Scripts />
      </body>
    </html>
  );
}

function RootNotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center">
      <p className="text-muted-foreground">页面不存在</p>
    </main>
  );
}
