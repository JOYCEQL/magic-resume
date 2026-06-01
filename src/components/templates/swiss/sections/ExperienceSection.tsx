import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Experience, GlobalSettings } from "@/types/resume";
import SectionTitle from "./SectionTitle";
import SectionWrapper from "../../shared/SectionWrapper";
import { normalizeRichTextContent } from "@/lib/richText";
import { formatDateString } from "@/lib/utils";
import { useLocale } from "@/i18n/compat/client";

interface ExperienceSectionProps {
    experiences?: Experience[];
    globalSettings?: GlobalSettings;
    showTitle?: boolean;
}

const ExperienceSection: React.FC<ExperienceSectionProps> = ({ experiences, globalSettings, showTitle = true }) => {
    const locale = useLocale();
    const visibleExperiences = experiences?.filter((exp) => exp.visible);
    const centerSubtitle = globalSettings?.centerSubtitle;
    const themeColor = globalSettings?.themeColor || "#E31C24";

    return (
        <SectionWrapper sectionId="experience" style={{ marginTop: `${globalSettings?.sectionSpacing || 24}px` }}>
            <SectionTitle type="experience" globalSettings={globalSettings} showTitle={showTitle} />
            <AnimatePresence mode="popLayout">
                <div className="flex flex-col gap-6" style={{ marginTop: `${globalSettings?.paragraphSpacing || 16}px` }}>
                    {visibleExperiences?.map((exp) => (
                        <motion.div key={exp.id} layout="position" className="group">
                            {/* 不对称网格对齐头部 */}
                            <div className="flex items-baseline justify-between gap-3">
                                <div className="flex min-w-0 flex-1 flex-wrap items-baseline gap-x-3 gap-y-1">
                                    <h4 
                                        className="font-extrabold text-slate-800 tracking-tight"
                                        style={{ fontSize: `${globalSettings?.subheaderSize || 16}px` }}
                                    >
                                        {exp.company}
                                    </h4>
                                    {centerSubtitle && (
                                        <span 
                                            className="font-medium text-slate-500 border-l border-slate-300 pl-3 text-[14px]"
                                            style={{ fontSize: `${(globalSettings?.subheaderSize || 16) - 1}px` }}
                                        >
                                            {exp.position}
                                        </span>
                                    )}
                                </div>
                                <div 
                                    className="ml-auto self-center font-mono text-slate-400 bg-slate-50 border border-slate-100/80 px-2 py-0.5 rounded text-[11px] font-semibold shrink-0"
                                >
                                    {formatDateString(exp.date, locale)}
                                </div>
                            </div>

                            {/* 非居中模式下的职位展示 */}
                            {exp.position && !centerSubtitle && (
                                <div 
                                    className="font-semibold text-slate-500 mt-1 uppercase tracking-wider"
                                    style={{ fontSize: `${(globalSettings?.subheaderSize || 16) - 2}px` }}
                                >
                                    {exp.position}
                                </div>
                            )}

                            {/* 详情内容 */}
                            {exp.details && (
                                <motion.div layout="position" className="relative pl-4 mt-2.5">
                                    <div 
                                        className="absolute left-0 top-1 bottom-1 w-[1.5px] opacity-20 group-hover:opacity-100 transition-opacity"
                                        style={{ backgroundColor: themeColor }}
                                    />
                                    <div 
                                        className="text-slate-600 prose prose-sm max-w-none prose-p:my-1 [&>ul]:pl-4 [&>ul]:mt-1 [&>ul>li]:my-0.5 marker:text-slate-400"
                                        dangerouslySetInnerHTML={{ __html: normalizeRichTextContent(exp.details) }}
                                        style={{ 
                                            fontSize: `${globalSettings?.baseFontSize || 13}px`, 
                                            lineHeight: globalSettings?.lineHeight || 1.6 
                                        }}
                                    />
                                </motion.div>
                            )}
                        </motion.div>
                    ))}
                </div>
            </AnimatePresence>
        </SectionWrapper>
    );
};

export default ExperienceSection;
