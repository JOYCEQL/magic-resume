"use client";
import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import Logo from "@/components/shared/Logo";
import ThemeToggle from "@/components/shared/ThemeToggle";
import { GitHubStars } from "@/components/shared/GitHubStars";
import LanguageSwitch from "../shared/LanguageSwitch";
import GoDashboard from "./GoDashboard";
import { Button } from "../ui/button";

export default function Header() {
  const [mounted, setMounted] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const t = useTranslations("home");

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY < 10) {
        setIsVisible(true);
        setLastScrollY(currentScrollY);
        return;
      }

      if (currentScrollY > lastScrollY && currentScrollY > 200) {
        setIsVisible(false);
      } else if (currentScrollY < lastScrollY) {
        setIsVisible(true);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY, mounted]);

  if (!mounted) {
    return null;
  }

  return (
    <div className="fixed w-full z-50 flex justify-center">
      <motion.div
        className="w-[90%] max-w-5xl"
        initial={{ y: 0, opacity: 1 }}
        animate={{
          y: isVisible ? 0 : -100,
          opacity: isVisible ? 1 : 0,
        }}
        transition={{
          duration: 0.2,
        }}
      >
        <div className="mt-4 rounded-full bg-background/70 backdrop-blur-[8px] border border-border/50 dark:border-white/10">
          <div className="relative flex items-center justify-between h-12 px-6">
            <div className="flex items-center space-x-2">
              <Logo size={32} />
              <span className="font-bold text-base">{t("header.title")}</span>
            </div>
            <div className="flex items-center space-x-2">
              <LanguageSwitch />

              <ThemeToggle>
                <div className="w-8 h-8 relative cursor-pointer rounded-md hover:bg-accent/50 flex items-center justify-center">
                  <Sun className="h-[1.2rem] w-[1.2rem] absolute inset-0 m-auto rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                  <Moon className="h-[1.2rem] w-[1.2rem] absolute inset-0 m-auto rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                </div>
              </ThemeToggle>
              <GitHubStars />
              <GoDashboard>
                <Button
                  type="submit"
                  className="bg-primary hover:opacity-90 text-white h-8 text-sm rounded-full px-4"
                >
                  {t("header.startButton")}
                </Button>
              </GoDashboard>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
