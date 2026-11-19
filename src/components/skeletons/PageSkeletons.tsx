import { useTranslations } from "@/i18n/compat/client";
import { Skeleton } from "@/components/ui/skeleton";
import { ResumePaperSkeleton } from "./ResumePaperSkeleton";

function LoadingAnnouncement() {
  const t = useTranslations("common");
  return <span role="status" className="sr-only">{t("loading")}</span>;
}

/** Mirrors the dashboard shell: sidebar, page header and resume card grid. */
export function DashboardSkeleton() {
  return (
    <div aria-busy="true" className="flex h-dvh overflow-hidden bg-background">
      <LoadingAnnouncement />
      <aside className="hidden w-64 shrink-0 flex-col border-r border-border/40 bg-card/50 md:flex">
        <div className="flex h-16 items-center justify-center gap-1 border-b border-border/40">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <Skeleton className="h-5 w-16" />
        </div>
        <div className="space-y-2 px-3 py-4">
          {["w-20", "w-20", "w-24", "w-20"].map((width, index) => (
            <div key={index} className="flex h-12 items-center gap-3 px-2">
              <Skeleton className="h-5 w-5 rounded-md" />
              <Skeleton className={`h-4 ${width}`} />
            </div>
          ))}
        </div>
      </aside>
      <main className="flex min-w-0 flex-1 flex-col">
        <div className="p-2">
          <Skeleton className="h-7 w-7" />
        </div>
        <div className="flex-1 space-y-6 overflow-hidden py-8">
          <div className="px-4">
            <Skeleton className="h-16 w-full rounded-xl" />
          </div>
          <div className="flex items-center justify-between px-4 sm:px-6">
            <Skeleton className="h-9 w-32" />
            <div className="flex gap-2">
              <Skeleton className="h-10 w-24 rounded-lg" />
              <Skeleton className="h-10 w-28 rounded-lg" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 p-3 sm:gap-6 sm:p-6 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
            {Array.from({ length: 4 }, (_, index) => (
              <div key={index} className="aspect-[210/297] overflow-hidden rounded-xl border border-border bg-card">
                <ResumePaperSkeleton className="h-full w-full bg-white p-3" />
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

/** Mirrors the workbench: header, edit panel and the resume preview canvas. */
export function WorkbenchSkeleton() {
  return (
    <div aria-busy="true" className="flex h-[100dvh] w-full flex-col overflow-hidden bg-background">
      <LoadingAnnouncement />
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-border px-6 pr-2">
        <div className="flex items-center gap-4">
          <Skeleton className="h-6 w-12" />
          <Skeleton className="hidden h-8 w-56 md:block" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-9 w-24 rounded-lg" />
        </div>
      </header>
      <div className="flex min-h-0 flex-1">
        <section className="hidden w-[36%] max-w-[560px] shrink-0 flex-col gap-7 border-r border-border p-4 md:flex">
          <Skeleton className="h-12 w-full rounded-xl" />
          <div className="space-y-3">
            <Skeleton className="h-5 w-14" />
            <div className="grid grid-cols-3 gap-3">
              {[0, 1, 2].map((index) => <Skeleton key={index} className="h-12 rounded-xl" />)}
            </div>
          </div>
          <div className="space-y-3">
            <Skeleton className="h-5 w-14" />
            <Skeleton className="h-24 w-full rounded-xl" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-5 w-20" />
            {[0, 1, 2, 3, 4].map((index) => (
              <div key={index} className="flex items-center gap-3">
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-9 flex-1 rounded-lg" />
              </div>
            ))}
          </div>
        </section>
        <section className="flex min-w-0 flex-1 justify-center overflow-hidden bg-gray-100 p-4 dark:bg-background md:p-8">
          <ResumePaperSkeleton className="aspect-[210/297] h-fit w-full max-w-[794px] rounded-sm bg-white p-[4%] shadow-sm" />
        </section>
      </div>
    </div>
  );
}
