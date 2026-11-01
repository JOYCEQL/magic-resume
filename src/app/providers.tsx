import { ThemeProvider } from "next-themes";
import { lazy, Suspense } from "react";

const AppProviders = lazy(() => import("./app-providers"));

export function Providers({
  children,
  forcedTheme,
}: {
  children: React.ReactNode;
  forcedTheme?: "light";
}) {
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
      {forcedTheme === "light" ? null : (
        <Suspense fallback={null}>
          <AppProviders />
        </Suspense>
      )}
    </ThemeProvider>
  );
}
