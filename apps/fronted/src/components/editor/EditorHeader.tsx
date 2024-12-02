"use client";

import { motion } from "framer-motion";
import { Sun, Moon, Eye } from "lucide-react";
import { useResumeStore } from "@/store/useResumeStore";
import { getThemeConfig } from "@/theme/themeConfig";
import PdfExport from "../shared/PdfExport";

interface EditorHeaderProps {
  isMobile?: boolean;
}

export function EditorHeader({ isMobile }: EditorHeaderProps) {
  const { theme, menuSections, activeSection, setActiveSection, toggleTheme } =
    useResumeStore();

  const themeConfig = getThemeConfig(theme === "dark");

  const visibleSections = menuSections
    .filter((section) => section.enabled)
    .sort((a, b) => a.order - b.order);

  return (
    <motion.header
      className={`h-16 border-b ${themeConfig.border} ${themeConfig.sidebar} sticky top-0 z-10`}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
    >
      <div className="flex items-center justify-between px-6 h-full">
        <div className="flex items-center space-x-6  scrollbar-hide">
          <motion.div
            className="flex items-center space-x-2 shrink-0 cursor-pointer"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <span className="text-lg font-semibold">Magic Resume</span>
            <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
          </motion.div>

          {/* 在移动端隐藏导航按钮 */}
          <div className="hidden md:flex items-center space-x-2">
            {visibleSections.map((section) => (
              <motion.button
                key={section.id}
                className={`px-4 py-1.5 rounded-lg text-sm flex items-center space-x-2 shrink-0 ${
                  activeSection === section.id
                    ? "bg-indigo-500/10 text-indigo-500"
                    : themeConfig.hover
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveSection(section.id)}
              >
                <span>{section.icon}</span>
                <span>{section.title}</span>
              </motion.button>
            ))}
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <motion.button
            className={`p-2 rounded-lg ${themeConfig.button}`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={toggleTheme}
          >
            {theme === "dark" ? (
              <Sun className="w-5 h-5" />
            ) : (
              <Moon className="w-5 h-5" />
            )}
          </motion.button>

          <div className="hidden md:flex items-center space-x-3">
            <PdfExport />
          </div>
        </div>
      </div>
    </motion.header>
  );
}
