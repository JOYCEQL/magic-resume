"use client";

import { useState } from "react";
import { usePathname } from "@/lib/navigation";
import { useTranslations } from "@/i18n/compat/client";
import { Menu, Moon, Sun, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import Logo from "@/components/shared/Logo";
import ThemeToggle from "@/components/shared/ThemeToggle";
import LanguageSwitch from "@/components/shared/LanguageSwitch";
import { GitHubStars } from "@/components/shared/GitHubStars";
import ScrollHeader from "./client/ScrollHeader";
import MobileMenu from "./client/MobileMenu";
import GoDashboard from "./GoDashboard";

export default function LandingHeader() {
  const t = useTranslations("home");
  const pathname = usePathname();
  const locale = pathname.split("/")[1];
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <>
      <ScrollHeader>
        <div className="mx-auto max-w-[1200px] px-4">
          <div className="flex items-center justify-between h-20">
            <div
              className="flex items-center  cursor-pointer group"
              onClick={() => (window.location.href = `/${locale}/`)}
            >
              <Logo size={60} />
              <span className="font-serif text-[24px] tracking-tight font-semibold text-foreground/90">
                {t("header.title")}
              </span>
            </div>

            <div className="hidden md:flex items-center gap-4">
              <LanguageSwitch />
              <ThemeToggle>
                <div className="w-9 h-9 relative cursor-pointer rounded-xl hover:bg-accent/80 flex items-center justify-center transition-colors">
                  <Sun className="h-[1.1rem] w-[1.1rem] absolute inset-0 m-auto rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                  <Moon className="h-[1.1rem] w-[1.1rem] absolute inset-0 m-auto rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                </div>
              </ThemeToggle>
              <GitHubStars />

              <GoDashboard>
                <Button
                  className="rounded-xl px-6 h-10 font-medium transition-all hover:opacity-90 active:scale-95"
                >
                  {t("header.startButton")}
                </Button>
              </GoDashboard>
            </div>

            <button
              className="md:hidden p-2.5 hover:bg-accent rounded-xl transition-colors"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      </ScrollHeader>

      <MobileMenu
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        buttonText={t("header.startButton")}
      />
    </>
  );
}
