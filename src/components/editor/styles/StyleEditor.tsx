"use client";

import { motion } from "framer-motion";
import { X, RotateCcw } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { useResumeStore } from "@/store/useResumeStore";
import { FONT_OPTIONS, DEFAULT_FONT_ID } from "@/config/fonts";
import {
  StyleRegion,
  STYLE_REGIONS,
  getRegionStyle,
  FONT_WEIGHT_OPTIONS,
  FONT_SIZE_RANGE,
  LINE_HEIGHT_RANGE,
  SPACING_RANGE,
  LETTER_SPACING_RANGE,
} from "@/config/textStyles";
import { StyleSlider } from "./StyleSlider";
import { StyleSelect } from "./StyleSelect";
import { StyleRadioGroup } from "./StyleRadioGroup";

interface StyleEditorProps {
  region: StyleRegion;
  onClose: () => void;
}

export function StyleEditor({ region, onClose }: StyleEditorProps) {
  const { activeResume, updateRegionStyle, resetRegionStyle } = useResumeStore();
  const globalSettings = activeResume?.globalSettings;
  const regionStyles = globalSettings?.regionStyles;
  const style = getRegionStyle(region, regionStyles);
  const t = useTranslations("workbench.sidePanel.styles");

  const regionMeta = STYLE_REGIONS.find((r) => r.id === region);

  const fontOptions = FONT_OPTIONS.map((f) => ({
    value: f.id,
    label: f.name,
  }));

  const fontWeightOptions = FONT_WEIGHT_OPTIONS.map((w) => ({
    value: w.value,
    label: w.label,
  }));

  const handleStyleChange = (key: string, value: number | string | undefined) => {
    updateRegionStyle(region, { [key]: value });
  };

  const handleReset = () => {
    resetRegionStyle(region);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "mt-3 p-4 rounded-lg border",
        "bg-gray-50 dark:bg-neutral-800 border-gray-200 dark:border-neutral-700"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h4 className="font-medium text-gray-800 dark:text-neutral-200">
            {t("editTitle", { name: t(`regions.${region}`) })}
          </h4>
          <p className="text-xs text-gray-500 dark:text-neutral-400 mt-0.5">
            {regionMeta?.description}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleReset}
            className="p-1.5 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-200 dark:text-neutral-400 dark:hover:text-neutral-200 dark:hover:bg-neutral-700 transition-colors"
            title={t("actions.reset")}
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-200 dark:text-neutral-400 dark:hover:text-neutral-200 dark:hover:bg-neutral-700 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Style Controls */}
      <div className="space-y-4">
        {/* Font Family */}
        <StyleSelect
          label={t("properties.fontFamily")}
          value={style.fontFamily || globalSettings?.fontFamily || DEFAULT_FONT_ID}
          options={fontOptions}
          onChange={(value) => handleStyleChange("fontFamily", value)}
        />

        {/* Font Size */}
        <StyleSlider
          label={t("properties.fontSize")}
          value={style.fontSize}
          min={FONT_SIZE_RANGE.min}
          max={FONT_SIZE_RANGE.max}
          step={FONT_SIZE_RANGE.step}
          unit="px"
          onChange={(value) => handleStyleChange("fontSize", value)}
        />

        {/* Font Weight */}
        <StyleRadioGroup
          label={t("properties.fontWeight")}
          value={style.fontWeight || "normal"}
          options={fontWeightOptions}
          onChange={(value) => handleStyleChange("fontWeight", value)}
        />

        {/* Line Height */}
        <StyleSlider
          label={t("properties.lineHeight")}
          value={style.lineHeight}
          min={LINE_HEIGHT_RANGE.min}
          max={LINE_HEIGHT_RANGE.max}
          step={LINE_HEIGHT_RANGE.step}
          unit="x"
          onChange={(value) => handleStyleChange("lineHeight", value)}
        />

        {/* Letter Spacing */}
        <StyleSlider
          label={t("properties.letterSpacing")}
          value={style.letterSpacing || 0}
          min={LETTER_SPACING_RANGE.min}
          max={LETTER_SPACING_RANGE.max}
          step={LETTER_SPACING_RANGE.step}
          unit="px"
          onChange={(value) => handleStyleChange("letterSpacing", value)}
        />

        {/* Margin Top */}
        <StyleSlider
          label={t("properties.marginTop")}
          value={style.marginTop || 0}
          min={SPACING_RANGE.min}
          max={SPACING_RANGE.max}
          step={SPACING_RANGE.step}
          unit="px"
          onChange={(value) => handleStyleChange("marginTop", value)}
        />

        {/* Margin Bottom */}
        <StyleSlider
          label={t("properties.marginBottom")}
          value={style.marginBottom || 0}
          min={SPACING_RANGE.min}
          max={SPACING_RANGE.max}
          step={SPACING_RANGE.step}
          unit="px"
          onChange={(value) => handleStyleChange("marginBottom", value)}
        />
      </div>
    </motion.div>
  );
}
