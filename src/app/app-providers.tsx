import { useResumeDirectorySync } from "@/hooks/useResumeDirectorySync";
import { Toaster } from "@/components/ui/sonner";
import appFontCss from "./font.css?url";
import tiptapCss from "@/styles/tiptap.scss?url";
import sonnerCss from "sonner/dist/styles.css?url";

// Editor-only dependencies and local directory synchronization stay out of the
// public landing page's initial JavaScript and hydration work.
// Rendered as a sibling of the route tree so loading it never remounts pages.
// HeroUI date inputs provide their own HeroUIProvider locally.
export default function AppProviders() {
  useResumeDirectorySync();
  return (
    <>
      {/* React owns these links so they survive a document remount. */}
      <link rel="stylesheet" href={appFontCss} />
      <link rel="stylesheet" href={tiptapCss} />
      <link rel="stylesheet" href={sonnerCss} />
      <Toaster position="top-center" richColors />
    </>
  );
}
