"use client";

import { ThemeProvider } from "next-themes";
import { Analytics } from "@vercel/analytics/next";
import { HeroUIProvider } from "@heroui/react";
import { useLocale } from "next-intl";

export function Providers({ children }: { children: React.ReactNode }) {
  const locale = useLocale();

  return (
    <HeroUIProvider locale={locale}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
          storageKey="magic-resume-theme"
        >
          {children}
          <Analytics />
        </ThemeProvider>
    </HeroUIProvider>
  );
}
