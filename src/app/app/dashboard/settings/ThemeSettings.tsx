import { Check, Monitor, Moon, Palette, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useTranslations } from "@/i18n/compat/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const themes = [
  { value: "light", icon: Sun },
  { value: "dark", icon: Moon },
  { value: "system", icon: Monitor },
] as const;

function ThemePreview({ dark }: { dark: boolean }) {
  return (
    <div
      aria-hidden="true"
      className={`flex h-16 overflow-hidden rounded-md border sm:h-20 ${
        dark ? "border-[#343437] bg-[#18181b]" : "border-[#e7e5e0] bg-[#f8f7f4]"
      }`}
    >
      <div
        className={`flex w-1/4 flex-col gap-1.5 border-r p-1.5 sm:p-2 ${
          dark ? "border-[#343437] bg-[#222225]" : "border-[#e7e5e0] bg-[#efeee9]"
        }`}
      >
        <div className={`mb-0.5 h-1.5 w-1/2 rounded-sm ${dark ? "bg-zinc-200" : "bg-zinc-900"}`} />
        <div className={`h-1 w-full rounded-sm ${dark ? "bg-[#525257]" : "bg-[#ceccc5]"}`} />
        <div className={`h-1 w-3/4 rounded-sm ${dark ? "bg-[#3b3b40]" : "bg-[#dddbd4]"}`} />
        <div className={`h-1 w-3/4 rounded-sm ${dark ? "bg-[#3b3b40]" : "bg-[#dddbd4]"}`} />
      </div>
      <div className="flex min-w-0 flex-1 items-start justify-center px-1.5 pt-2 sm:px-3 sm:pt-3">
        <div
          className={`w-full max-w-32 rounded-t border px-1.5 pb-3 pt-2 sm:px-3 ${
            dark ? "border-[#414146] bg-[#29292d]" : "border-[#e7e5e0] bg-white"
          }`}
        >
          <div className={`mb-1.5 h-1.5 w-1/2 rounded-sm ${dark ? "bg-[#e4e4e7]" : "bg-[#555550]"}`} />
          <div className={`mb-2 h-0.5 w-3/4 rounded-sm ${dark ? "bg-[#67676e]" : "bg-[#d6d4cc]"}`} />
          <div className={`mb-1.5 h-0.5 w-1/3 rounded-sm ${dark ? "bg-zinc-200" : "bg-zinc-900"}`} />
          <div className={`mb-1.5 h-0.5 w-full rounded-sm ${dark ? "bg-[#52525b]" : "bg-[#deddd7]"}`} />
          <div className={`h-0.5 w-4/5 rounded-sm ${dark ? "bg-[#52525b]" : "bg-[#deddd7]"}`} />
        </div>
      </div>
    </div>
  );
}

export default function ThemeSettings() {
  const { theme, setTheme } = useTheme();
  const t = useTranslations("dashboard.settings.appearance");

  return (
    <Card className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-xs transition-shadow hover:shadow-sm">
      <CardHeader className="border-b border-border/40 p-6 pb-5">
        <div className="flex items-start gap-4">
          <div className="relative flex size-10 shrink-0 items-center justify-center rounded-xl bg-zinc-900 text-white shadow-xs dark:bg-zinc-800 dark:text-zinc-100 dark:border dark:border-zinc-700">
            <Palette className="size-5" />
          </div>
          <div className="space-y-1">
            <CardTitle className="text-base sm:text-lg font-semibold tracking-tight text-foreground">
              {t("title")}
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              {t("description")}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <fieldset className="min-w-0">
          <legend className="sr-only">{t("title")}</legend>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            {themes.map(({ value, icon: Icon }) => (
              <label key={value} className="relative min-w-0 cursor-pointer group">
                <input
                  type="radio"
                  name="theme"
                  value={value}
                  checked={theme === value}
                  onChange={() => setTheme(value)}
                  className="peer sr-only"
                  aria-label={t(value)}
                />
                <div className="rounded-xl border border-border/80 bg-background/50 p-2 transition-all duration-200 group-hover:border-foreground/20 group-hover:bg-accent/30 peer-checked:border-zinc-900 peer-checked:bg-zinc-900/[0.03] peer-checked:ring-2 peer-checked:ring-zinc-900/15 dark:peer-checked:border-zinc-100 dark:peer-checked:bg-zinc-100/[0.04] dark:peer-checked:ring-zinc-100/20 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ring">
                  <div className="relative">
                    <ThemePreview dark={value === "dark"} />
                    {value === "system" && (
                      <div className="absolute inset-0 [clip-path:inset(0_0_0_50%)]">
                        <ThemePreview dark />
                      </div>
                    )}
                  </div>
                  <div className="flex min-h-9 items-center justify-center gap-2 pt-2 text-xs sm:text-sm font-medium text-foreground">
                    <Icon aria-hidden="true" className="size-4 shrink-0 opacity-70" />
                    <span>{t(value)}</span>
                  </div>
                </div>
                <span
                  aria-hidden="true"
                  className="absolute right-3 top-3 flex size-4 items-center justify-center rounded-full border border-transparent text-transparent peer-checked:border-zinc-900 peer-checked:bg-zinc-900 peer-checked:text-white dark:peer-checked:border-zinc-100 dark:peer-checked:bg-zinc-100 dark:peer-checked:text-zinc-900 transition-all shadow-xs"
                >
                  <Check className="size-2.5" strokeWidth={3} />
                </span>
              </label>
            ))}
          </div>
        </fieldset>
      </CardContent>
    </Card>
  );
}
