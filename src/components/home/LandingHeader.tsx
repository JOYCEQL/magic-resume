"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { FileText, Menu, Moon, Sun, X } from "lucide-react";

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
  const locale = pathname.split("/")[1]; // 从路径中获取语言代码
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <>
      <ScrollHeader>
        <div className="mx-auto max-w-[1200px] px-4">
          <div className="flex items-center justify-between h-16">
            <div
              className="flex items-center gap-2 cursor-pointer"
              onClick={() => (window.location.href = `/${locale}/`)}
            >
              <Logo size={32} />
              <span className="font-bold text-[24px]">{t("header.title")}</span>
            </div>

            <div className="hidden md:flex items-center gap-4">
              <LanguageSwitch />
              <ThemeToggle>
                <div className="w-8 h-8 relative cursor-pointer rounded-md hover:bg-accent/50 flex items-center justify-center">
                  <Sun className="h-[1.2rem] w-[1.2rem] absolute inset-0 m-auto rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                  <Moon className="h-[1.2rem] w-[1.2rem] absolute inset-0 m-auto rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                </div>
              </ThemeToggle>
              <GitHubStars />

              <Link
                href={`/${locale}/changelog`}
                className="flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-full bg-primary/10 text-primary hover:bg-primary/15 transition-colors"
              >
                <FileText className="h-3.5 w-3.5" />
                {t("changelog") || "更新日志"}
              </Link>

              <GoDashboard>
                <Button
                  type="submit"
                  className="bg-primary hover:opacity-90 text-white h-8 text-sm  px-4"
                >
                  {t("header.startButton")}
                </Button>
              </GoDashboard>
            </div>

            <button
              className="md:hidden p-2 hover:bg-accent rounded-md"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
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
