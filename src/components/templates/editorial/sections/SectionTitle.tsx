import { useMemo } from "react";
import { GlobalSettings } from "@/types/resume";
import { useTemplateContext } from "../../TemplateContext";
import { useResumeStore } from "@/store/useResumeStore";

interface SectionTitleProps {
  type: string;
  title?: string;
  globalSettings?: GlobalSettings;
  showTitle?: boolean;
}

const SectionTitle = ({ type, title, globalSettings, showTitle = true }: SectionTitleProps) => {
  const { activeResume } = useResumeStore();
  const templateContext = useTemplateContext();
  const menuSections = templateContext?.menuSections ?? activeResume?.menuSections ?? [];

  const renderTitle = useMemo(() => {
    if (type === "custom") return title;
    return menuSections.find((s) => s.id === type)?.title;
  }, [menuSections, type, title]);

  if (!showTitle) return null;

  return (
    <div className="w-full shrink-0 mb-6">
      <h3
        className="font-bold uppercase tracking-[0.2em]"
        style={{ 
          fontSize: `${globalSettings?.headerSize || 18}px`,
          color: globalSettings?.themeColor || "#8e8e8e",
          marginBottom: `${globalSettings?.paragraphSpacing || 16}px`
        }}
      >
        {renderTitle}
      </h3>
    </div>
  );
};

export default SectionTitle;
