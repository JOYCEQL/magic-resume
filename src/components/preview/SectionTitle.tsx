"use client";
import { useMemo } from "react";
import { GlobalSettings } from "@/types/resume";
import { useResumeStore } from "@/store/useResumeStore";
import { cn } from "@/lib/utils";
import { templateConfigs } from "@/config/templates";

interface SectionTitleProps {
  globalSettings?: GlobalSettings;
  type: string;
  title?: string;
}

const SectionTitle = ({ type, title, globalSettings }: SectionTitleProps) => {
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

  const baseStyles = useMemo(
    () => ({
      fontSize: `${globalSettings?.headerSize || styles.fontSize}px`,
      fontWeight: "bold",
      color: themeColor,
      marginBottom: `${globalSettings?.paragraphSpacing}px`,
    }),
    [
      globalSettings?.headerSize,
      globalSettings?.paragraphSpacing,
      styles.fontSize,
      themeColor,
    ]
  );

  const renderTemplateTitle = () => {
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
