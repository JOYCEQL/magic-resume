import { ThemeProvider } from "next-themes";
import { HeroUIProvider } from "@heroui/react";
import { useLocale } from "@/i18n/compat/client";
import { useResumeDirectorySync } from "@/hooks/useResumeDirectorySync";

export function Providers({
  children,
  forcedTheme,
}: {
  children: React.ReactNode;
  forcedTheme?: "light";
}) {
  const locale = useLocale();
  useResumeDirectorySync();

  return (
    <HeroUIProvider locale={locale}>
      <ThemeProvider
        attribute="class"
        defaultTheme="light"
        forcedTheme={forcedTheme}
        enableSystem
        disableTransitionOnChange
        storageKey="magic-resume-theme"
      >
        {children}
      </ThemeProvider>
    </HeroUIProvider>
  );
}
