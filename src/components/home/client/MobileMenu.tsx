"use client";

import { motion } from "framer-motion";
import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";
import { Sun, Moon, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import ThemeToggle from "@/components/shared/ThemeToggle";
import LanguageSwitch from "@/components/shared/LanguageSwitch";
import { GitHubStars } from "@/components/shared/GitHubStars";

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  buttonText: string;
  extraItems?: Array<{
    icon: React.ReactNode;
    label: string;
    component: React.ReactNode;
  }>;
}

export default function MobileMenu({
  isOpen,
  onClose,
  buttonText,
  extraItems = [],
}: MobileMenuProps) {
  const t = useTranslations("home");
  const locale = useLocale();

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="fixed inset-x-0 top-16 z-50 md:hidden"
    >
      <div className="bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t border-b dark:border-gray-800">
        <nav className="mx-auto max-w-[1200px] px-4 py-6 flex flex-col gap-6">
          <div className="flex items-center justify-center gap-8">
            <LanguageSwitch />
            <ThemeToggle>
              <div className="w-8 h-8 relative cursor-pointer rounded-md hover:bg-accent/50 flex items-center justify-center">
                <Sun className="h-[1.2rem] w-[1.2rem] absolute inset-0 m-auto rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="h-[1.2rem] w-[1.2rem] absolute inset-0 m-auto rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              </div>
            </ThemeToggle>
            <GitHubStars />
          </div>

          <div className="flex items-center justify-center">
            <Link
              href={`/${locale}/changelog`}
              className="flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-full bg-primary/10 text-primary hover:bg-primary/15 transition-colors"
            >
              <FileText className="h-3.5 w-3.5" />
              {t("changelog")}
            </Link>
          </div>

          {extraItems && extraItems.length > 0 && (
            <div className="flex flex-col items-center justify-center gap-2">
              {extraItems.map((item, index) => (
                <div key={index}>{item.component}</div>
              ))}
            </div>
          )}

          <div className="flex flex-col gap-3 px-4">
            <Button
              size="default"
              className="bg-primary hover:opacity-90 text-white w-full py-6"
              asChild
            >
              <Link href="/app/dashboard" onClick={onClose}>
                {buttonText}
              </Link>
            </Button>
          </div>
        </nav>
      </div>
    </motion.div>
  );
}
