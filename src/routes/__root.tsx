import {
  createRootRoute,
  HeadContent,
  Outlet,
  Scripts,
} from "@tanstack/react-router";
import appCss from "../app/globals.css?url";
import appFontCss from "../app/font.css?url";
import tiptapCss from "../styles/tiptap.scss?url";
import { NextIntlClientProvider } from "@/i18n/compat/client";
import { getMessagesForLocale } from "@/i18n/messages";
import { Providers } from "@/app/providers";
import { Toaster } from "@/components/ui/sonner";
import { heroUiLocales } from "@/i18n/config";
import { LocaleProvider, useAppLocale } from "@/i18n/locale-context";
import { useTranslations } from "@/i18n/compat/client";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
      { title: "Magic Resume" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      {
        rel: "stylesheet",
        href: appFontCss,
      },
      {
        rel: "stylesheet",
        href: tiptapCss,
      },
    ],
  }),
  component: RootComponent,
  notFoundComponent: RootNotFound,
});

function AppShell({ children }: { children: React.ReactNode }) {
  const locale = useAppLocale();
  const messages = getMessagesForLocale(locale);

  return (
    <html lang={heroUiLocales[locale]} suppressHydrationWarning>
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
          <Providers>
            {children}
            <Toaster position="top-center" richColors />
          </Providers>
        </NextIntlClientProvider>
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  return (
    <LocaleProvider>
      <AppShell>
        <Outlet />
      </AppShell>
    </LocaleProvider>
  );
}

function NotFoundContent() {
  const t = useTranslations("common");

  return (
    <main className="min-h-screen flex items-center justify-center">
      <p className="text-muted-foreground">{t("notFound")}</p>
    </main>
  );
}

function RootNotFound() {
  return (
    <LocaleProvider>
      <AppShell>
        <NotFoundContent />
      </AppShell>
    </LocaleProvider>
  );
}
