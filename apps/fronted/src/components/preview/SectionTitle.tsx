import { useMemo } from "react";
import { GlobalSettings } from "@/types/resume";
import { useResumeStore } from "@/store/useResumeStore";
interface SectionTitleProps {
  themeColor: string;
  globalSettings?: GlobalSettings;
  type: string;
  title?: string;
}

export function SectionTitle({
  type,
  title,
  themeColor,
  globalSettings
}: SectionTitleProps) {
  const sectionTitleStyles = {
    fontSize: `${globalSettings?.headerSize || 18}px`,
    borderColor: themeColor,
    color: themeColor
  };
  const { menuSections } = useResumeStore();

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
}
