import { useResumeDirectorySync } from "@/hooks/useResumeDirectorySync";
import { Toaster } from "@/components/ui/sonner";

// Editor-only dependencies and local directory synchronization stay out of the
// public landing page's initial JavaScript and hydration work.
// Rendered as a sibling of the route tree so loading it never remounts pages.
// HeroUI date inputs provide their own HeroUIProvider locally.
export default function AppProviders() {
  useResumeDirectorySync();
  return (
    <>
      <Toaster position="top-center" richColors />
    </>
  );
}
