import { useEffect, useMemo } from "react";
import { useRouterState } from "@tanstack/react-router";
import { NextIntlClientProvider } from "next-intl";
import { Providers } from "@/app/providers";
import { resolveLocale } from "@/i18n/runtime";
import { getMessagesByLocale } from "@/i18n/messages";
import { Toaster } from "@/components/ui/sonner";

export function RouteProviders({ children }: { children: React.ReactNode }) {
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  const locale = useMemo(() => resolveLocale(pathname), [pathname]);
  const messages = useMemo(() => getMessagesByLocale(locale), [locale]);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <Providers>
        {children}
        <Toaster position="top-center" richColors />
      </Providers>
    </NextIntlClientProvider>
  );
}
