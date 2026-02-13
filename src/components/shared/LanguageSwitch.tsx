import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "@tanstack/react-router";
import { Languages } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { locales, localeNames, type Locale } from "@/i18n/config";

export default function LanguageSwitch() {
  const { i18n } = useTranslation();
  const currentLocale = i18n.language as Locale;
  const location = useLocation();
  const navigate = useNavigate();

  const handleLocaleChange = (newLocale: Locale) => {
    i18n.changeLanguage(newLocale);
    // If on a locale-prefixed route, swap the locale in the URL
    const pathname = location.pathname;
    const segments = pathname.split("/");
    if (segments.length > 1 && locales.includes(segments[1] as Locale)) {
      segments[1] = newLocale;
      navigate({ to: segments.join("/") || "/" });
    }
  };

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
              className={currentLocale === loc ? "bg-accent" : ""}
              onClick={() => handleLocaleChange(loc)}
            >
              <span className="flex items-center gap-2">
                {localeNames[loc]}
                {currentLocale === loc && (
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
