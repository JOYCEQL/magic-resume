"use client";
import { useState } from "react";
import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { Languages } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { locales, localeNames } from "@/i18n/config";
import { usePathname } from "@/i18n/routing.public";
import { persistLocale, withLocale } from "@/i18n/runtime";

export default function LanguageSwitch() {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const handleSelectLocale = (nextLocale: string) => {
    if (nextLocale === locale) {
      setOpen(false);
      return;
    }

    persistLocale(nextLocale);
    setOpen(false);

    const nextPath = withLocale(pathname, nextLocale);

    window.setTimeout(() => {
      router.push(nextPath);
    }, 0);
  };

  return (
    <DropdownMenu modal={false} open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 relative hover:bg-accent/50"
        >
          <Languages className="h-[1.2rem] w-[1.2rem]" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {locales.map((loc) => {
          return (
            <DropdownMenuItem
              key={loc}
              className={locale === loc ? "bg-accent" : ""}
              onSelect={(event) => {
                event.preventDefault();
                handleSelectLocale(loc);
              }}
            >
              <span className="flex w-full items-center gap-2">
                {localeNames[loc]}
                {locale === loc && (
                  <span className="text-xs text-muted-foreground">✓</span>
                )}
              </span>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
