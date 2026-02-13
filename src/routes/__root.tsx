/// <reference types="vite/client" />
import type { ReactNode } from "react";
import {
  Outlet,
  createRootRoute,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { I18nextProvider } from "react-i18next";
import { ThemeProvider } from "next-themes";
import { HeroUIProvider } from "@heroui/react";
import { Toaster } from "@/components/ui/sonner";
import i18n from "@/i18n/config";
import appCss from "@/styles/globals.css?url";
import fontCss from "@/styles/font.css?url";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "MagicV - AI Resume Builder" },
      {
        name: "description",
        content: "Professional AI-powered resume builder",
      },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "stylesheet", href: fontCss },
      { rel: "icon", href: "/favicon.ico?v=2" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Newsreader:ital,opsz,wght@0,6..72,200..800;1,6..72,200..800&display=swap",
      },
    ],
  }),
  component: RootComponent,
});

function RootComponent() {
  return (
    <RootDocument>
      <Outlet />
    </RootDocument>
  );
}

function RootDocument({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang={i18n.language} suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body>
        <I18nextProvider i18n={i18n}>
          <HeroUIProvider locale={i18n.language}>
            <ThemeProvider
              attribute="class"
              defaultTheme="light"
              enableSystem
              disableTransitionOnChange
              storageKey="magic-resume-theme"
            >
              {children}
              <Toaster position="top-center" richColors />
            </ThemeProvider>
          </HeroUIProvider>
        </I18nextProvider>
        <Scripts />
      </body>
    </html>
  );
}
