import { Check, Languages } from "lucide-react";
import { useTranslations } from "@/i18n/compat/client";
import { useLocaleSwitch } from "@/hooks/useLocaleSwitch";
import { cn } from "@/lib/utils";
import type { Locale } from "@/i18n/config";

interface LanguageOption {
  value: Locale;
  labelKey: "zh" | "en";
  descKey: "zhDesc" | "enDesc";
  glyph: string;
  code: string;
  sampleTitle: string;
  sampleMeta: string;
}

const languageOptions: LanguageOption[] = [
  {
    value: "zh",
    labelKey: "zh",
    descKey: "zhDesc",
    glyph: "文",
    code: "ZH-CN",
    sampleTitle: "个人简历",
    sampleMeta: "教育 · 经历",
  },
  {
    value: "en",
    labelKey: "en",
    descKey: "enDesc",
    glyph: "Aa",
    code: "EN-US",
    sampleTitle: "Resume",
    sampleMeta: "Bio · Work",
  },
];

function LanguagePreview({ option }: { option: LanguageOption }) {
  return (
    <div
      aria-hidden="true"
      className="flex h-20 overflow-hidden rounded-lg border border-[#e6e4de] bg-[#f7f6f2] dark:border-[#323236] dark:bg-[#161618]"
    >
      {/* Left Type Specimen */}
      <div className="flex w-[36%] flex-col items-center justify-center border-r border-[#e8e6e0] bg-[#f0efe9] px-2 dark:border-[#2c2c30] dark:bg-[#1e1e21]">
        <span className="font-serif text-xl font-semibold leading-none tracking-tight text-zinc-800 dark:text-zinc-100">
          {option.glyph}
        </span>
        <span className="mt-1.5 font-mono text-[9px] font-medium tracking-wider text-zinc-500 dark:text-zinc-400">
          {option.code}
        </span>
      </div>

      {/* Right Mini Localized Document */}
      <div className="flex min-w-0 flex-1 items-start justify-center px-2.5 pt-2.5">
        <div className="h-full w-full rounded-t-md border border-b-0 border-[#e5e3dc] bg-white px-2.5 pt-2 shadow-[0_1px_3px_rgba(0,0,0,0.03)] dark:border-[#38383d] dark:bg-[#242428]">
          <div className="flex items-center justify-between gap-1">
            <span className="truncate font-sans text-[10px] font-semibold leading-none tracking-tight text-zinc-800 dark:text-zinc-200">
              {option.sampleTitle}
            </span>
            <span className="size-2.5 shrink-0 rounded-full bg-[#eae8e1] dark:bg-zinc-700" />
          </div>
          <div className="my-1.5 h-px w-full bg-[#eeece6] dark:bg-zinc-700/70" />
          <div className="truncate font-sans text-[9px] leading-tight text-zinc-500 dark:text-zinc-400">
            {option.sampleMeta}
          </div>
          <div className="mt-1.5 space-y-1">
            <div className="h-1 w-full rounded-sm bg-[#dcdad2] dark:bg-zinc-600" />
            <div className="h-1 w-3/4 rounded-sm bg-[#e6e4dc] dark:bg-zinc-700" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LanguageSettings() {
  const { locale, switchLocale } = useLocaleSwitch();
  const t = useTranslations("dashboard.settings.language");

  return (
    <section className="flex h-full flex-col justify-between rounded-2xl border border-border/80 bg-white/90 p-6 shadow-[0_1px_2px_rgba(28,28,24,0.03),0_6px_20px_rgba(28,28,24,0.02)] dark:bg-card">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary/70 text-foreground">
          <Languages className="h-4 w-4" />
        </div>
        <h2 className="font-sans text-base font-semibold tracking-tight text-foreground">
          {t("title")}
        </h2>
      </div>

      <fieldset className="mt-5 min-w-0">
        <legend className="sr-only">{t("title")}</legend>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {languageOptions.map((option) => {
            const { value, labelKey } = option;
            const isSelected = locale === value;
            return (
              <label key={value} className="relative min-w-0 cursor-pointer group">
                <input
                  type="radio"
                  name="language"
                  value={value}
                  checked={isSelected}
                  onChange={() => switchLocale(value)}
                  className="peer sr-only"
                  aria-label={t(labelKey)}
                />
                <div
                  className={cn(
                    "flex flex-col rounded-xl border p-2.5 transition-all duration-150",
                    "peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ring",
                    isSelected
                      ? "border-foreground/70 bg-white shadow-[0_2px_8px_rgba(28,28,24,0.05)] ring-1 ring-foreground/10 dark:border-foreground/65 dark:bg-secondary/55 dark:ring-foreground/15"
                      : "border-border/70 bg-background/45 hover:border-foreground/20 hover:bg-background/85 dark:border-border/60 dark:bg-background/25 dark:hover:border-foreground/25 dark:hover:bg-secondary/35"
                  )}
                >
                  <LanguagePreview option={option} />
                  <div className="mt-2.5 flex h-5 items-center justify-between gap-2 px-1">
                    <div className="flex min-w-0 items-center gap-1.5">
                      <span className="shrink-0 text-xs sm:text-[13px] font-medium text-foreground">
                        {t(labelKey)}
                      </span>
                    </div>
                    <span
                      aria-hidden="true"
                      className={cn(
                        "flex size-4 shrink-0 items-center justify-center rounded-full border transition-all duration-150",
                        isSelected
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border/90 bg-transparent text-transparent group-hover:border-foreground/35"
                      )}
                    >
                      <Check className="size-2.5 stroke-[2.75]" />
                    </span>
                  </div>
                </div>
              </label>
            );
          })}
        </div>
      </fieldset>
    </section>
  );
}
