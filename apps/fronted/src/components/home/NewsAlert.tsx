import { ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

interface NewsAlertProps {
  className?: string;
}

export default function NewsAlert({ className }: NewsAlertProps) {
  const t = useTranslations("home");

  return (
    <div
      className={cn(
        "relative inline-flex items-center gap-3 px-5 py-2.5 text-sm font-medium rounded-full",
        "bg-gradient-to-r from-slate-900/90 to-slate-800/90 dark:from-slate-50/10 dark:to-slate-100/5",
        "backdrop-blur-md shadow-lg shadow-black/5 dark:shadow-white/5",
        "hover:shadow-xl hover:shadow-black/10 dark:hover:shadow-white/10",
        "border border-white/10 dark:border-white/5",
        "transition-all duration-300 cursor-pointer group",
        className
      )}
    >
      <div className="flex items-center justify-center w-[4.5rem] h-7 bg-gradient-to-r from-amber-400 to-amber-500 dark:from-amber-500 dark:to-amber-600 rounded-full text-black dark:text-white font-semibold shadow-sm">
        {t("news.label")}
      </div>
      <span className="text-white/90 dark:text-white/80 whitespace-nowrap">
        {t("news.content")}
      </span>
      {/* <ArrowRight className="w-4 h-4 text-white/50 group-hover:text-white/90 dark:text-white/40 dark:group-hover:text-white/80 transition-colors flex-shrink-0" /> */}
    </div>
  );
}
