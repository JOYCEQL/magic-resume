
import { ThemeProvider } from "next-themes";
import { HeroUIProvider } from "@heroui/react";
import { useLocale } from "@/i18n/compat/client";
import { heroUiLocales } from "@/i18n/config";
import { useResumeDirectorySync } from "@/hooks/useResumeDirectorySync";

export function Providers({ children }: { children: React.ReactNode }) {
  const locale = useLocale();
  useResumeDirectorySync();

  return (
    <HeroUIProvider locale={heroUiLocales[locale]}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
          storageKey="magic-resume-theme"
        >
          {children}
        </ThemeProvider>
    </HeroUIProvider>
  );
}
