"use client";
import { useMemo } from "react";
import { GlobalSettings } from "@/types/resume";
import { useResumeStore } from "@/store/useResumeStore";
import { cn } from "@/lib/utils";
import { templateConfigs } from "@/config/templates";
import { getRegionStyle } from "@/config/textStyles";

interface SectionTitleProps {
  globalSettings?: GlobalSettings;
  type: string;
  title?: string;
  showTitle?: boolean;
}

const SectionTitle = ({ type, title, globalSettings, showTitle = true }: SectionTitleProps) => {
  const { activeResume } = useResumeStore();
  const { menuSections = [], templateId = "default" } = activeResume || {};

  const renderTitle = useMemo(() => {
    if (type === "custom") {
      return title;
    }
    const sectionConfig = menuSections.find((s) => s.id === type);
    return sectionConfig?.title;
  }, [menuSections, type, title]);

  const config =
    templateConfigs[templateId as string] || templateConfigs["default"];
  const { styles } = config.sectionTitle;

  const themeColor = globalSettings?.themeColor;

  const sectionTitleStyle = getRegionStyle('sectionTitle', globalSettings?.regionStyles);
  
  const fontWeightMap: Record<string, number> = {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  };

  const baseStyles = useMemo(
    () => ({
      fontSize: `${sectionTitleStyle.fontSize}px`,
      fontWeight: sectionTitleStyle.fontWeight ? fontWeightMap[sectionTitleStyle.fontWeight] : 700,
      lineHeight: sectionTitleStyle.lineHeight,
      color: themeColor,
      marginTop: sectionTitleStyle.marginTop ? `${sectionTitleStyle.marginTop}px` : undefined,
      marginBottom: sectionTitleStyle.marginBottom ? `${sectionTitleStyle.marginBottom}px` : undefined,
      letterSpacing: sectionTitleStyle.letterSpacing ? `${sectionTitleStyle.letterSpacing}px` : undefined,
    }),
    [
      sectionTitleStyle,
      themeColor,
    ]
  );

  const renderTemplateTitle = () => {
    if (!showTitle) return null;
    switch (templateId) {
      case "modern":
        return (
          <h3
            className={cn("border-b pb-2")}
            style={{
              ...baseStyles,
              borderColor: themeColor,
            }}
          >
            {renderTitle}
          </h3>
        );

      case "left-right":
        return (
          <div className="relative">
            <div
              className="absolute inset-0"
              style={{
                backgroundColor: themeColor,
                opacity: 0.1,
              }}
            />
            <h3
              className={cn("pl-4 py-1 flex items-center relative")}
              style={{
                ...baseStyles,
                color: themeColor,
                borderLeft: `3px solid ${themeColor}`,
              }}
            >
              {renderTitle}
            </h3>
          </div>
        );

      case "classic":
        return (
          <h3
            className={cn("pb-2 border-b")}
            style={{
              ...baseStyles,
              color: themeColor,
              borderColor: themeColor,
            }}
          >
            {renderTitle}
          </h3>
        );

      default:
        return (
          <h3
            className={cn("pb-2")}
            style={{
              ...baseStyles,
              color: themeColor,
            }}
          >
            {renderTitle}
          </h3>
        );
    }
  };

  return renderTemplateTitle();
};

export default SectionTitle;
