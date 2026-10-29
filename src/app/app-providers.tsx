import { HeroUIProvider } from "@heroui/react";
import { useLocale } from "@/i18n/compat/client";
import { useResumeDirectorySync } from "@/hooks/useResumeDirectorySync";
import { Toaster } from "@/components/ui/sonner";
import appFontCss from "./font.css?url";
import tiptapCss from "@/styles/tiptap.scss?url";
import sonnerCss from "sonner/dist/styles.css?url";

// Editor-only dependencies and local directory synchronization stay out of the
// public landing page's initial JavaScript and hydration work.
export default function AppProviders({ children }: { children: React.ReactNode }) {
  const locale = useLocale();
  useResumeDirectorySync();
  return (
    <HeroUIProvider locale={locale}>
      {/* React owns these links so they survive a document remount. */}
      <link rel="stylesheet" href={appFontCss} />
      <link rel="stylesheet" href={tiptapCss} />
      <link rel="stylesheet" href={sonnerCss} />
      {children}
      <Toaster position="top-center" richColors />
    </HeroUIProvider>
  );
}
