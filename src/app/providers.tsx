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
      {forcedTheme === "light" ? children : (
        <Suspense fallback={null}>
          <AppProviders>{children}</AppProviders>
        </Suspense>
      )}
    </ThemeProvider>
  );
}
