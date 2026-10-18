import { Check, Monitor, Moon, Palette, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useTranslations } from "@/i18n/compat/client";
import { cn } from "@/lib/utils";

const themes = [
  { value: "light", icon: Sun },
  { value: "dark", icon: Moon },
  { value: "system", icon: Monitor },
] as const;

function ThemePreview({ dark }: { dark: boolean }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "flex h-20 overflow-hidden rounded-lg border",
        dark
          ? "border-[#323236] bg-[#161618]"
          : "border-[#e6e4de] bg-[#f7f6f2]"
      )}
    >
      {/* Mini Sidebar */}
      <div
        className={cn(
          "flex w-[28%] flex-col gap-1.5 border-r p-2",
          dark
            ? "border-[#2c2c30] bg-[#1e1e21]"
            : "border-[#e8e6e0] bg-[#f0efe9]"
        )}
      >
        <div className="mb-0.5 flex items-center gap-1">
          <div
            className={cn(
              "size-2 rounded-[3px]",
              dark ? "bg-zinc-200" : "bg-zinc-800"
            )}
          />
          <div
            className={cn(
              "h-1.5 w-8 rounded-sm",
              dark ? "bg-zinc-300" : "bg-zinc-800"
            )}
          />
        </div>
        <div
          className={cn(
            "h-2 w-full rounded-[3px]",
            dark ? "bg-zinc-700/90" : "bg-[#dfddd5]"
          )}
        />
        <div
          className={cn(
            "h-1.5 w-3/4 rounded-sm",
            dark ? "bg-zinc-800" : "bg-[#e5e3dc]"
          )}
        />
        <div
          className={cn(
            "h-1.5 w-2/3 rounded-sm",
            dark ? "bg-zinc-800" : "bg-[#e5e3dc]"
          )}
        />
      </div>

      {/* Mini Resume Canvas */}
      <div className="flex min-w-0 flex-1 items-start justify-center px-2.5 pt-2.5">
        <div
          className={cn(
            "h-full w-full max-w-[140px] rounded-t-md border border-b-0 px-2.5 pt-2 shadow-[0_1px_3px_rgba(0,0,0,0.03)]",
            dark
              ? "border-[#38383d] bg-[#242428]"
              : "border-[#e5e3dc] bg-white"
          )}
        >
          <div className="mb-1.5 flex items-center justify-between">
            <div className="space-y-1">
              <div
                className={cn(
                  "h-1.5 w-10 rounded-sm",
                  dark ? "bg-zinc-200" : "bg-zinc-800"
                )}
              />
              <div
                className={cn(
                  "h-1 w-14 rounded-sm",
                  dark ? "bg-zinc-500" : "bg-[#cbc9c0]"
                )}
              />
            </div>
            <div
              className={cn(
                "size-3 rounded-full",
                dark ? "bg-zinc-700" : "bg-[#eae8e1]"
              )}
            />
          </div>
          <div
            className={cn(
              "mb-1.5 h-px w-full",
              dark ? "bg-zinc-700/70" : "bg-[#eeece6]"
            )}
          />
          <div className="space-y-1">
            <div
              className={cn(
                "h-1 w-7 rounded-sm",
                dark ? "bg-zinc-300" : "bg-zinc-700"
              )}
            />
            <div
              className={cn(
                "h-1 w-full rounded-sm",
                dark ? "bg-zinc-600" : "bg-[#dcdad2]"
              )}
            />
            <div
              className={cn(
                "h-1 w-4/5 rounded-sm",
                dark ? "bg-zinc-600" : "bg-[#dcdad2]"
              )}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ThemeSettings() {
  const { theme, setTheme } = useTheme();
  const t = useTranslations("dashboard.settings.appearance");
  const activeTheme = theme ?? "system";

  return (
    <section className="flex h-full flex-col justify-between rounded-2xl border border-border/80 bg-white/90 p-6 shadow-[0_1px_2px_rgba(28,28,24,0.03),0_6px_20px_rgba(28,28,24,0.02)] dark:bg-card">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary/70 text-foreground">
          <Palette className="h-4 w-4" />
        </div>
        <h2 className="font-sans text-base font-semibold tracking-tight text-foreground">
          {t("title")}
        </h2>
      </div>

      <fieldset className="mt-5 min-w-0">
        <legend className="sr-only">{t("title")}</legend>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {themes.map(({ value, icon: Icon }) => {
            const isSelected = activeTheme === value;
            return (
              <label key={value} className="relative min-w-0 cursor-pointer group">
                <input
                  type="radio"
                  name="theme"
                  value={value}
                  checked={isSelected}
                  onChange={() => setTheme(value)}
                  className="peer sr-only"
                  aria-label={t(value)}
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
                  <div className="relative">
                    <ThemePreview dark={value === "dark"} />
                    {value === "system" && (
                      <>
                        <div className="absolute inset-0 [clip-path:inset(0_0_0_50%)]">
                          <ThemePreview dark />
                        </div>
                        <div
                          aria-hidden="true"
                          className="pointer-events-none absolute inset-y-0 left-1/2 w-px bg-border/70"
                        />
                      </>
                    )}
                  </div>
                  <div className="mt-2.5 flex h-5 items-center justify-between gap-2 px-1">
                    <div className="flex min-w-0 items-center gap-1.5 text-xs sm:text-[13px] font-medium text-foreground">
                      <Icon
                        aria-hidden="true"
                        className={cn(
                          "size-3.5 shrink-0 transition-colors",
                          isSelected
                            ? "text-foreground"
                            : "text-muted-foreground group-hover:text-foreground"
                        )}
                      />
                      <span className="truncate">{t(value)}</span>
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
