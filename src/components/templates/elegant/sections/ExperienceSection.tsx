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
    const flexLayout = globalSettings?.flexibleHeaderLayout;

    return (
        <SectionWrapper sectionId="experience" style={{ marginTop: `${globalSettings?.sectionSpacing || 24}px` }}>
            <SectionTitle type="experience" globalSettings={globalSettings} showTitle={showTitle} />
            <AnimatePresence mode="popLayout">
                {visibleExperiences?.map((exp) => (
                    <motion.div key={exp.id} layout="position" style={{ marginTop: `${globalSettings?.paragraphSpacing}px` }}>
                        <motion.div className="flex items-center gap-2">
                            <div className={`font-bold ${flexLayout ? "" : "flex-[1.5]"}`} style={{ fontSize: `${globalSettings?.subheaderSize || 16}px` }}>
                                {exp.company}
                            </div>
                            {centerSubtitle && (
                                <motion.div className={`text-subtitleFont ${flexLayout ? "ml-[16px]" : "flex-1"}`} style={{ fontSize: `${globalSettings?.subheaderSize || 16}px` }}>
                                    {exp.position}
                                </motion.div>
                            )}
                            <div className={`text-subtitleFont shrink-0 ${flexLayout ? "ml-auto" : "flex-1 text-right"}`} style={{ fontSize: `${globalSettings?.subheaderSize || 16}px` }}>
                                {formatDateString(exp.date, locale)}
                            </div>
                        </motion.div>
                        {exp.position && !centerSubtitle && (
                            <motion.div className="text-subtitleFont" style={{ fontSize: `${globalSettings?.subheaderSize || 16}px` }}>{exp.position}</motion.div>
                        )}
                        {exp.details && (
                            <motion.div className="mt-2 text-baseFont" dangerouslySetInnerHTML={{ __html: normalizeRichTextContent(exp.details) }}
                                style={{ fontSize: `${globalSettings?.baseFontSize || 14}px`, lineHeight: globalSettings?.lineHeight || 1.6 }}
                            />
                        )}
                    </motion.div>
                ))}
            </AnimatePresence>
        </SectionWrapper>
    );
};

export default ExperienceSection;
