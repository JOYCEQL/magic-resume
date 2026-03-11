import { AnimatePresence, motion } from "framer-motion";
import { Education, GlobalSettings } from "@/types/resume";
import SectionTitle from "./SectionTitle";
import SectionWrapper from "../../shared/SectionWrapper";
import { useLocale } from "@/i18n/compat/client";
import { hasMeaningfulRichTextContent, normalizeRichTextContent } from "@/lib/richText";
import { formatDateString, cn } from "@/lib/utils";

interface EducationSectionProps {
    education?: Education[];
    globalSettings?: GlobalSettings;
    showTitle?: boolean;
    variant?: "default" | "sidebar";
}

const EducationSection = ({ education, globalSettings, showTitle = true, variant = "default" }: EducationSectionProps) => {
    const locale = useLocale();
    const visibleEducation = education?.filter((edu) => edu.visible);
    const centerSubtitle = globalSettings?.centerSubtitle;
    const flexLayout = globalSettings?.flexibleHeaderLayout;

    const isSidebar = variant === "sidebar";

    return (
        <SectionWrapper sectionId="education" style={{ marginTop: isSidebar ? 0 : `${globalSettings?.sectionSpacing || 24}px` }}>
            <SectionTitle
                type="education"
                globalSettings={globalSettings}
                showTitle={showTitle}
                variant={variant}
            />
            <AnimatePresence mode="popLayout">
                {visibleEducation?.map((edu) => (
                    <motion.div key={edu.id} layout="position" style={{ marginTop: isSidebar ? "12px" : `${globalSettings?.paragraphSpacing}px` }}>
                        <div className={cn("flex gap-4 items-center justify-between", isSidebar && "flex-col items-start gap-1")}>
                            <div className={cn("font-bold truncate", !flexLayout && !isSidebar && "flex-1")}
                                style={{ fontSize: `${isSidebar ? (globalSettings?.baseFontSize || 14) + 2 : (globalSettings?.subheaderSize || 16)}px`, color: isSidebar ? "#fff" : "inherit" }}>
                                {edu.school}
                            </div>
                            {centerSubtitle && !isSidebar && (
                                <motion.div layout="position" className={cn("text-subtitleFont truncate", flexLayout ? "ml-[16px]" : "flex-1")}
                                    style={{ fontSize: `${globalSettings?.subheaderSize || 16}px` }}>
                                    {[edu.major, edu.degree].filter(Boolean).join(" · ")}
                                    {edu.gpa && ` · GPA ${edu.gpa}`}
                                </motion.div>
                            )}
                            <span className={cn("text-subtitleFont shrink-0 whitespace-nowrap", !flexLayout && !isSidebar && "text-right", isSidebar && "opacity-80")}
                                suppressHydrationWarning
                                style={{ fontSize: isSidebar ? "12px" : `${globalSettings?.subheaderSize || 16}px`, color: isSidebar ? "#fff" : "inherit" }}>
                                {`${formatDateString(edu.startDate, locale)} - ${formatDateString(edu.endDate, locale)}`}
                            </span>
                        </div>
                        {(!centerSubtitle || isSidebar) && (
                            <div className={cn("text-subtitleFont mt-0.5", isSidebar ? "text-xs opacity-90" : "mt-1")}
                                style={{ fontSize: isSidebar ? "12px" : `${globalSettings?.subheaderSize || 16}px`, color: isSidebar ? "#fff" : "inherit" }}>
                                {[edu.major, edu.degree].filter(Boolean).join(" · ")}
                                {edu.gpa && ` · GPA ${edu.gpa}`}
                            </div>
                        )}
                        {hasMeaningfulRichTextContent(edu.description) && (
                            <motion.div layout="position" className={cn("mt-1 text-baseFont", isSidebar && " opacity-80")}
                                style={{
                                    fontSize: `${isSidebar ? (globalSettings?.baseFontSize || 14) - 2 : (globalSettings?.baseFontSize || 14)}px`,
                                    lineHeight: globalSettings?.lineHeight || 1.6,
                                    color: isSidebar ? "#fff" : "inherit"
                                }}
                                dangerouslySetInnerHTML={{ __html: normalizeRichTextContent(edu.description) }}
                            />
                        )}
                    </motion.div>
                ))}
            </AnimatePresence>
        </SectionWrapper>
    );
};

export default EducationSection;
