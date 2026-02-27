import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import SectionTitle from "./SectionTitle";
import SectionWrapper from "../../shared/SectionWrapper";
import { Project, GlobalSettings } from "@/types/resume";
import { normalizeRichTextContent } from "@/lib/richText";
import { formatDateString } from "@/lib/utils";
import { useLocale } from "@/i18n/compat/client";

interface ProjectSectionProps {
    projects: Project[];
    globalSettings?: GlobalSettings;
    showTitle?: boolean;
}

const ProjectSection: React.FC<ProjectSectionProps> = ({ projects, globalSettings, showTitle = true }) => {
    const locale = useLocale();
    const visibleProjects = projects?.filter((p) => p.visible);
    const centerSubtitle = globalSettings?.centerSubtitle;
    const flexLayout = globalSettings?.flexibleHeaderLayout;

    return (
        <SectionWrapper sectionId="projects" style={{ marginTop: `${globalSettings?.sectionSpacing || 24}px` }}>
            <SectionTitle type="projects" globalSettings={globalSettings} showTitle={showTitle} />
            <motion.div layout="position">
                <AnimatePresence mode="popLayout">
                    {visibleProjects.map((project) => (
                        <motion.div key={project.id} style={{ marginTop: `${globalSettings?.paragraphSpacing}px` }}>
                            <motion.div className="flex items-center gap-2">
                                <div className={`flex items-center gap-2 ${flexLayout ? "" : "flex-[1.5]"}`}>
                                    <h3 className="font-bold" style={{ fontSize: `${globalSettings?.subheaderSize || 16}px` }}>{project.name}</h3>
                                </div>
                                {project.link && !centerSubtitle && (
                                    <a href={project.link.startsWith("http") ? project.link : `https://${project.link}`} target="_blank" rel="noopener noreferrer"
                                        className={`underline ${flexLayout ? "" : "flex-1"}`} title={project.link}>
                                        {(() => { try { return new URL(project.link.startsWith("http") ? project.link : `https://${project.link}`).hostname.replace(/^www\./, ""); } catch { return project.link; } })()}
                                    </a>
                                )}
                                {!project.link && !centerSubtitle && !flexLayout && <div className="flex-1" />}
                                {centerSubtitle && (
                                    <motion.div layout="position" className={`text-subtitleFont ${flexLayout ? "ml-[16px]" : "flex-1"}`} style={{ fontSize: `${globalSettings?.subheaderSize || 16}px` }}>
                                        {project.role}
                                    </motion.div>
                                )}
                                <div className={`text-subtitleFont shrink-0 ${flexLayout ? "ml-auto" : "flex-1 text-right"}`} style={{ fontSize: `${globalSettings?.subheaderSize || 16}px` }}>
                                    {formatDateString(project.date, locale)}
                                </div>
                            </motion.div>
                            {project.role && !centerSubtitle && (
                                <motion.div layout="position" className="text-subtitleFont" style={{ fontSize: `${globalSettings?.subheaderSize || 16}px` }}>{project.role}</motion.div>
                            )}
                            {project.link && centerSubtitle && (
                                <a href={project.link.startsWith("http") ? project.link : `https://${project.link}`} target="_blank" rel="noopener noreferrer" className="underline" title={project.link}>{project.link}</a>
                            )}
                            {project.description && (
                                <motion.div layout="position" className="mt-2 text-baseFont"
                                    style={{ fontSize: `${globalSettings?.baseFontSize || 14}px`, lineHeight: globalSettings?.lineHeight || 1.6 }}
                                    dangerouslySetInnerHTML={{ __html: normalizeRichTextContent(project.description) }}
                                />
                            )}
                        </motion.div>
                    ))}
                </AnimatePresence>
            </motion.div>
        </SectionWrapper>
    );
};

export default ProjectSection;
