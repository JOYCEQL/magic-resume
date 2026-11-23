import { ThemeProvider } from "next-themes";
import { lazy, Suspense, useEffect, useState } from "react";

const AppProviders = lazy(() => import("./app-providers"));

export function Providers({
  children,
  forcedTheme,
}: {
  children: React.ReactNode;
  forcedTheme?: "light";
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      forcedTheme={forcedTheme}
      enableSystem
      disableTransitionOnChange
      storageKey="magic-resume-theme"
    >
      {/*
        Keep `children` in a stable fiber slot. Wrapping it conditionally would
        remount the whole route tree (and suspend it to a blank fallback) when
        leaving the landing page.
      */}
      {children}
      {/* Browser-only services must not create a server Suspense boundary:
          theme updates can reach it before its lazy chunk hydrates on slow links. */}
      {mounted && forcedTheme !== "light" ? (
        <Suspense fallback={null}>
          <AppProviders />
        </Suspense>
      ) : null}
    </ThemeProvider>
  );
}
