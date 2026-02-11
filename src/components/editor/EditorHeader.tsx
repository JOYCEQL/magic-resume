"use client";
import { useTranslations } from "next-intl";
import { AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import PdfExport from "../shared/PdfExport";
import ThemeToggle from "../shared/ThemeToggle";
import { useResumeStore } from "@/store/useResumeStore";
import { getThemeConfig } from "@/theme/themeConfig";
import { useGrammarCheck } from "@/hooks/useGrammarCheck";
import {
  HoverCard,
  HoverCardTrigger,
  HoverCardContent
} from "@/components/ui/hover-card";
import { Button } from "@/components/ui/button";
import { GrammarCheckDrawer } from "./grammar/GrammarCheckDrawer";

interface EditorHeaderProps {
  isMobile?: boolean;
}

export function EditorHeader({ isMobile }: EditorHeaderProps) {
  const { activeResume, setActiveSection, updateResumeTitle } =
    useResumeStore();
  const { menuSections = [], activeSection } = activeResume || {};
  const themeConfig = getThemeConfig();
  const { errors, selectError } = useGrammarCheck();
  const router = useRouter();
  const t = useTranslations();
  const visibleSections = menuSections
    ?.filter((section) => section.enabled)
    .sort((a, b) => a.order - b.order);

  return (
    <motion.header
      className={`h-16 border-b sticky top-0 z-10`}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
    >
      <div className="flex items-center justify-between px-6 h-full pr-2">
        <div className="flex items-center space-x-6  scrollbar-hide">
          <motion.div
            className="flex items-center space-x-2 shrink-0 cursor-pointer"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              router.push("/app/dashboard");
            }}
          >
            <span className="text-lg font-semibold">{t("common.title")}</span>
          </motion.div>
        </div>

        <div className="flex items-center space-x-3">
          <GrammarCheckDrawer />
          {errors.length > 0 && (
             <div 
                className="flex items-center space-x-1 cursor-pointer animate-pulse"
                onClick={() => document.dispatchEvent(new CustomEvent('open-grammar-drawer'))}
             >
                  <AlertCircle className="w-4 h-4 text-red-500" />
                  <span className="text-sm text-red-500">
                    {t("grammarCheck.found_issues", { count: errors.length })}
                  </span>
             </div>
          )}
          <Input
            defaultValue={activeResume?.title || ""}
            onBlur={(e) => {
              updateResumeTitle(e.target.value || "未命名简历");
            }}
            className="w-60  text-sm hidden md:block"
            placeholder="简历名称"
          />

          <ThemeToggle></ThemeToggle>
          <div className="md:flex items-center ">
            <PdfExport />
          </div>
        </div>
      </div>
    </motion.header>
  );
}
