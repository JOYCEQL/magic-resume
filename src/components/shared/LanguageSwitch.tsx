import { Languages } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useLocaleSwitch } from "@/hooks/useLocaleSwitch";

export default function LanguageSwitch() {
  const { locale, locales, localeNames, switchLocale } = useLocaleSwitch();

  return (
    <DropdownMenu>
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
              onClick={() => switchLocale(loc)}
            >
              <span className="flex items-center gap-2">
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
