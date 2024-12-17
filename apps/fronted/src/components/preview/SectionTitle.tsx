"use client";
import { useMemo } from "react";
import { GlobalSettings } from "@/types/resume";
import { useResumeStore } from "@/store/useResumeStore";
interface SectionTitleProps {
  globalSettings?: GlobalSettings;
  type: string;
  title?: string;
}

const SectionTitle = ({ type, title, globalSettings }: SectionTitleProps) => {
  const sectionTitleStyles = {
    fontSize: `${globalSettings?.headerSize || 18}px`,
    borderColor: globalSettings?.themeColor,
    color: globalSettings?.themeColor,
  };
  const { activeResume } = useResumeStore();
  const { menuSections = [] } = activeResume || {};
  const renderTitle = useMemo(() => {
    if (type === "custom") {
      return title;
    }
    const sectionConfig = menuSections.find((s) => s.id === type);
    return sectionConfig?.title;
  }, [menuSections, type]);

  return (
    <h3
      className="font-semibold border-b border-gray-200 pb-2"
      style={sectionTitleStyles}
    >
      {renderTitle}
    </h3>
  );
};
export default SectionTitle;
