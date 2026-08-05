import { useMemo } from "react";
import { GlobalSettings } from "@/types/resume";
import { useTemplateContext } from "../../TemplateContext";

interface SectionTitleProps {
    globalSettings?: GlobalSettings;
    type: string;
    title?: string;
    showTitle?: boolean;
}

const SectionTitle = ({ type, title, globalSettings, showTitle = true }: SectionTitleProps) => {
    const templateContext = useTemplateContext();
    const menuSections = templateContext?.menuSections ?? [];

    const renderTitle = useMemo(() => {
        if (type === "custom") return title;
        return menuSections.find((s) => s.id === type)?.title;
    }, [menuSections, type, title]);

    const themeColor = globalSettings?.themeColor;

    if (!showTitle) return null;

    return (
        <h3
            className="pb-2 border-b font-bold"
            style={{
                fontSize: `${globalSettings?.headerSize || 18}px`,
                color: themeColor,
                borderColor: themeColor,
                marginBottom: `${globalSettings?.paragraphSpacing}px`,
            }}
        >
            {renderTitle}
        </h3>
    );
};

export default SectionTitle;
