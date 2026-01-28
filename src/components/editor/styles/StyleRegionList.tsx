"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { useResumeStore } from "@/store/useResumeStore";
import {
  STYLE_REGIONS,
  getRegionStyle,
  getFontWeightLabel,
  StyleRegion,
} from "@/config/textStyles";
import { StyleEditor } from "./StyleEditor";

export function StyleRegionList() {
  const [selectedRegion, setSelectedRegion] = useState<StyleRegion | null>(null);
  const { activeResume } = useResumeStore();
  const globalSettings = activeResume?.globalSettings;
  const regionStyles = globalSettings?.regionStyles;
  const t = useTranslations("workbench.sidePanel.styles");

  const handleRegionClick = (regionId: StyleRegion) => {
    setSelectedRegion(selectedRegion === regionId ? null : regionId);
  };

  const handleClose = () => {
    setSelectedRegion(null);
  };

  return (
    <div className="space-y-2">
      {STYLE_REGIONS.map((region) => {
        const style = getRegionStyle(region.id, regionStyles);
        const isSelected = selectedRegion === region.id;

        return (
          <div key={region.id}>
            <motion.button
              type="button"
              onClick={() => handleRegionClick(region.id)}
              className={cn(
                "w-full flex items-center justify-between p-3 rounded-lg border transition-all text-left",
                isSelected
                  ? "border-primary bg-primary/5 dark:bg-primary/10"
                  : "border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 hover:border-gray-300 dark:hover:border-neutral-600"
              )}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-800 dark:text-neutral-200 text-sm">
                    {t(`regions.${region.id}`)}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-1 text-xs text-gray-500 dark:text-neutral-400">
                  <span>{style.fontSize}px</span>
                  <span>·</span>
                  <span>{getFontWeightLabel(style.fontWeight)}</span>
                  <span>·</span>
                  <span>{style.lineHeight}x</span>
                </div>
              </div>
              <ChevronRight
                className={cn(
                  "w-4 h-4 text-gray-400 transition-transform",
                  isSelected && "rotate-90"
                )}
              />
            </motion.button>
            <AnimatePresence>
              {isSelected && (
                <StyleEditor
                  region={region.id}
                  onClose={handleClose}
                />
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
