"use client";

import { ThemeProvider } from "next-themes";
import { Analytics } from "@vercel/analytics/next";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
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
  );
}
