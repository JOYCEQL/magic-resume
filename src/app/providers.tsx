"use client";

import { ThemeProvider } from "next-themes";
import { Analytics } from "@vercel/analytics/next";
import { HeroUIProvider } from "@heroui/react";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <HeroUIProvider>
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
