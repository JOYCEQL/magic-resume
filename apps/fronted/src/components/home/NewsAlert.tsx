import { ArrowRight, Sparkles } from "lucide-react";
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
        "bg-white shadow-[0_1px_1px_rgba(0,0,0,0.1)] dark:bg-slate-900",
        "border border-slate-200/80 dark:border-white/10",
        "hover:shadow-[0_2px_2px_rgba(0,0,0,0.1)] dark:hover:shadow-white/5",
        "transition-all duration-300 cursor-pointer group",
        className
      )}
    >
      <div className="flex items-center gap-1 text-black font-semibold">🎉</div>
      <span className="text-slate-600 dark:text-white/80 whitespace-nowrap">
        {t("news.content")}
      </span>
      {/* <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600 dark:text-white/40 dark:group-hover:text-white/80 transition-colors flex-shrink-0" /> */}
    </div>
  );
}
