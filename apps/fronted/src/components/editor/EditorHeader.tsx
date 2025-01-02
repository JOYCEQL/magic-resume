"use client";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import PdfExport from "../shared/PdfExport";
import ThemeToggle from "../shared/ThemeToggle";
import { useResumeStore } from "@/store/useResumeStore";
import { getThemeConfig } from "@/theme/themeConfig";
import { useGrammarCheck } from "@/hooks/useGrammarCheck";
import { useEffect } from "react";
import { toast } from "sonner";
import {
  HoverCard,
  HoverCardTrigger,
  HoverCardContent,
} from "@/components/ui/hover-card";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";

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
            <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
          </motion.div>
        </div>

        <div className="flex items-center space-x-3">
          {errors.length > 0 && (
            <HoverCard>
              <HoverCardTrigger asChild>
                <div className="flex items-center space-x-1 cursor-pointer">
                  <AlertCircle className="w-4 h-4 text-red-500" />
                  <span className="text-sm text-red-500">
                    发现 {errors.length} 个问题
                  </span>
                </div>
              </HoverCardTrigger>
              <HoverCardContent className="w-80">
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">语法检查结果</h4>
                  <div className="space-y-1">
                    {errors.map((error, index) => (
                      <div key={index} className="text-sm space-y-1">
                        <div className="flex items-start gap-2">
                          <AlertCircle className="w-4 h-4 mt-0.5 text-red-500 shrink-0" />
                          <div className="flex-1">
                            <div className="flex items-start justify-between gap-2">
                              <p>{error.message}</p>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 px-2 text-xs"
                                onClick={() => selectError(index)}
                              >
                                定位
                              </Button>
                            </div>
                            {error.suggestions.length > 0 && (
                              <div className="mt-1">
                                <p className="text-xs text-muted-foreground font-medium">
                                  建议修改：
                                </p>
                                {error.suggestions.map((suggestion, i) => (
                                  <p
                                    key={i}
                                    className="text-xs mt-1 px-2 py-1 bg-muted rounded"
                                  >
                                    {suggestion}
                                  </p>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </HoverCardContent>
            </HoverCard>
          )}
          <Input
            defaultValue={activeResume?.title || ""}
            onBlur={(e) => {
              updateResumeTitle(e.target.value || "未命名简历");
            }}
            className="w-60  text-sm"
            placeholder="简历名称"
          />

          <ThemeToggle></ThemeToggle>
          <div className="hidden md:flex items-center ">
            <PdfExport />
          </div>
        </div>
      </div>
    </motion.header>
  );
}
