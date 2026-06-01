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

    const themeColor = globalSettings?.themeColor || "#E31C24"; // 默认瑞士红
    if (!showTitle) return null;

    return (
        <div
            className="flex flex-col w-full"
            style={{
                marginBottom: `${globalSettings?.paragraphSpacing || 12}px`,
            }}
        >
            <div className="flex items-center gap-2.5">
                {/* 瑞士风格高亮色块 */}
                <div
                    className="w-[6px] rounded-sm shrink-0"
                    style={{
                        height: `${(globalSettings?.headerSize || 18) * 1.1}px`,
                        backgroundColor: themeColor,
                    }}
                />
                <h3
                    className="font-black tracking-wider uppercase"
                    style={{
                        fontSize: `${globalSettings?.headerSize || 18}px`,
                        color: "#0f172a",
                    }}
                >
                    {renderTitle}
                </h3>
            </div>
            {/* 不对称的分隔线 */}
            <div
                className="w-full h-[1px] mt-2 opacity-15"
                style={{
                    backgroundColor: "#0f172a",
                }}
            />
        </div>
    );
};

export default SectionTitle;
