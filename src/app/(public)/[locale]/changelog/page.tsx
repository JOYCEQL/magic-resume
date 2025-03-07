"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { ArrowLeft } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import ChangelogTimeline from "@/components/shared/ChangelogTimeline";
import { getChangelog } from "@/lib/getChangelog";
import { cn } from "@/lib/utils";

export default function ChangelogPage() {
  const t = useTranslations("home");
  const changelogEntries = getChangelog();
  const router = useRouter();
  const pathname = usePathname();
  const locale = pathname.split("/")[1];

  return (
    <div className="container max-w-5xl mx-auto px-4 md:px-6 py-8">
      <div className="mb-10 flex flex-col items-center relative">
        <button
          onClick={() => router.push(`/${locale}/`)}
          className="absolute left-0 top-1/2 -translate-y-1/2 p-2.5 rounded-md bg-primary/10 hover:bg-primary/15 transition-colors flex items-center gap-2"
          aria-label="返回"
        >
          <ArrowLeft className="h-5 w-5 text-primary" />
        </button>

        <h1 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/70 inline-block mb-4">
          {t("changelog")}
        </h1>
        <div className="w-20 h-1 bg-gradient-to-r from-primary/80 to-primary/20 mx-auto rounded-full"></div>
      </div>

      <div
        className={cn(
          "relative p-8 mb-12 overflow-hidden rounded-xl",
          "before:absolute before:inset-0 before:bg-gradient-to-br before:from-primary/5 before:via-primary/3 before:to-transparent before:rounded-xl",
          "after:absolute after:inset-0 after:bg-white/40 dark:after:bg-gray-900/40 after:backdrop-blur-sm after:rounded-xl after:-z-10",
          "border border-white/20 dark:border-gray-700/30 shadow-sm"
        )}
      >
        <div className="relative z-10 mx-auto">
          <ChangelogTimeline entries={changelogEntries} />
        </div>
      </div>
    </div>
  );
}
