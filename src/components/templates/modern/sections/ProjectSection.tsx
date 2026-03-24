import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import SectionTitle from "./SectionTitle";
import SectionWrapper from "../../shared/SectionWrapper";
import { Project, GlobalSettings } from "@/types/resume";
import { normalizeRichTextContent } from "@/lib/richText";
import { formatDateString, cn } from "@/lib/utils";
import { useLocale } from "@/i18n/compat/client";
import { getProjectLinkMeta } from "@/lib/projectLink";

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
                    {visibleProjects.map((project) => {
                        const projectLink = getProjectLinkMeta(project, {
                            preferFullUrl: centerSubtitle,
                        });

                        return (
                        <motion.div key={project.id} style={{ marginTop: `${globalSettings?.paragraphSpacing}px` }}>
                            <motion.div className="flex items-center justify-between gap-4">
                                <div className={cn("flex items-center gap-2 truncate", flexLayout ? "" : "flex-1")}>
                                    <h3 className="font-bold truncate" style={{ fontSize: `${globalSettings?.subheaderSize || 16}px` }}>{project.name}</h3>
                                </div>
                                {projectLink && !centerSubtitle && (
                                    <a href={projectLink.href} target="_blank" rel="noopener noreferrer"
                                        className={cn("underline truncate shrink", flexLayout ? "" : "flex-1")} title={projectLink.title}>
                                        {projectLink.label}
                                    </a>
                                )}
                                {!projectLink && !centerSubtitle && !flexLayout && <div className="flex-1" />}
                                {centerSubtitle && (
                                    <motion.div layout="position" className={cn("text-subtitleFont truncate", flexLayout ? "ml-[16px]" : "flex-1")} style={{ fontSize: `${globalSettings?.subheaderSize || 16}px` }}>
                                        {project.role}
                                    </motion.div>
                                )}
                                <div className={cn("text-subtitleFont shrink-0 whitespace-nowrap", flexLayout ? "ml-auto" : "text-right")} style={{ fontSize: `${globalSettings?.subheaderSize || 16}px` }}>
                                    {formatDateString(project.date, locale)}
                                </div>
                            </motion.div>
                            {project.role && !centerSubtitle && (
                                <motion.div layout="position" className="text-subtitleFont" style={{ fontSize: `${globalSettings?.subheaderSize || 16}px` }}>{project.role}</motion.div>
                            )}
                            {projectLink && centerSubtitle && (
                                <a href={projectLink.href} target="_blank" rel="noopener noreferrer" className="underline" title={projectLink.title}>{projectLink.label}</a>
                            )}
                            {project.description && (
                                <motion.div layout="position" className="mt-1 text-baseFont"
                                    style={{ fontSize: `${globalSettings?.baseFontSize || 14}px`, lineHeight: globalSettings?.lineHeight || 1.6 }}
                                    dangerouslySetInnerHTML={{ __html: normalizeRichTextContent(project.description) }}
                                />
                            )}
                        </motion.div>
                    )})}
                </AnimatePresence>
            </motion.div>
        </SectionWrapper>
    );
};

export default ProjectSection;
