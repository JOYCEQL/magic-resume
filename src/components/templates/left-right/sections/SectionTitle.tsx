import { useMemo } from "react";
import { GlobalSettings } from "@/types/resume";
import { useTemplateContext } from "../../TemplateContext";
import { useResumeStore } from "@/store/useResumeStore";

interface SectionTitleProps {
    globalSettings?: GlobalSettings;
    type: string;
    title?: string;
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

    const themeColor = globalSettings?.themeColor;
    if (!showTitle) return null;

    return (
        <div className="relative">
            <div className="absolute inset-0" style={{ backgroundColor: themeColor, opacity: 0.1 }} />
            <h3
                className="pl-4 py-1 flex items-center relative font-bold"
                style={{
                    fontSize: `${globalSettings?.headerSize || 18}px`,
                    color: themeColor,
                    borderLeft: `3px solid ${themeColor}`,
                    marginBottom: `${globalSettings?.paragraphSpacing}px`,
                }}
            >
                {renderTitle}
            </h3>
        </div>
    );
};

export default SectionTitle;
