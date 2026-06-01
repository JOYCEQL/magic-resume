import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import * as Icons from "lucide-react";
import SectionTitle from "./SectionTitle";
import SectionWrapper from "../../shared/SectionWrapper";
import { Project, GlobalSettings } from "@/types/resume";
import { normalizeRichTextContent } from "@/lib/richText";
import { formatDateString } from "@/lib/utils";
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
    const themeColor = globalSettings?.themeColor || "#E31C24";

    return (
        <SectionWrapper sectionId="projects" style={{ marginTop: `${globalSettings?.sectionSpacing || 24}px` }}>
            <SectionTitle type="projects" globalSettings={globalSettings} showTitle={showTitle} />
            <motion.div layout="position" className="flex flex-col gap-6" style={{ marginTop: `${globalSettings?.paragraphSpacing || 16}px` }}>
                <AnimatePresence mode="popLayout">
                    {visibleProjects.map((project) => {
                        const projectLink = getProjectLinkMeta(project, {
                            preferFullUrl: centerSubtitle,
                        });

                        return (
                            <motion.div key={project.id} layout="position" className="group">
                                {/* 项目排版头部 */}
                                <div className="flex items-baseline justify-between gap-3">
                                    <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-3 gap-y-1">
                                        <h4 
                                            className="font-extrabold text-slate-800 tracking-tight"
                                            style={{ fontSize: `${globalSettings?.subheaderSize || 16}px` }}
                                        >
                                            {project.name}
                                        </h4>
                                        {centerSubtitle && (
                                            <span 
                                                className="font-medium text-slate-500 border-l border-slate-300 pl-3 text-[14px]"
                                                style={{ fontSize: `${(globalSettings?.subheaderSize || 16) - 1}px` }}
                                            >
                                                {project.role}
                                            </span>
                                        )}

                                        {/* 瑞士风格精致小卡片链接 */}
                                        {projectLink && (
                                            <a 
                                                href={projectLink.href} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-slate-50 border border-slate-100 hover:bg-slate-100 transition-colors text-slate-500 font-medium"
                                                title={projectLink.title}
                                            >
                                                <Icons.ExternalLink className="w-3 h-3 shrink-0" style={{ color: themeColor }} />
                                                <span>{projectLink.label}</span>
                                            </a>
                                        )}
                                    </div>
                                    <div 
                                        className="ml-auto self-center font-mono text-slate-400 bg-slate-50 border border-slate-100/80 px-2 py-0.5 rounded text-[11px] font-semibold shrink-0"
                                    >
                                        {formatDateString(project.date, locale)}
                                    </div>
                                </div>

                                {/* 非居中模式下的角色展示 */}
                                {project.role && !centerSubtitle && (
                                    <div 
                                        className="font-semibold text-slate-500 mt-1 uppercase tracking-wider"
                                        style={{ fontSize: `${(globalSettings?.subheaderSize || 16) - 2}px` }}
                                    >
                                        {project.role}
                                    </div>
                                )}

                                {/* 项目描述内容 */}
                                {project.description && (
                                    <motion.div layout="position" className="relative pl-4 mt-2.5">
                                        <div 
                                            className="absolute left-0 top-1 bottom-1 w-[1.5px] opacity-20 group-hover:opacity-100 transition-opacity"
                                            style={{ backgroundColor: themeColor }}
                                        />
                                        <div 
                                            className="text-slate-600 prose prose-sm max-w-none prose-p:my-1 [&>ul]:pl-4 [&>ul]:mt-1 [&>ul>li]:my-0.5 marker:text-slate-400"
                                            style={{ 
                                                fontSize: `${globalSettings?.baseFontSize || 13}px`, 
                                                lineHeight: globalSettings?.lineHeight || 1.6 
                                            }}
                                            dangerouslySetInnerHTML={{ __html: normalizeRichTextContent(project.description) }}
                                        />
                                    </motion.div>
                                )}
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </motion.div>
        </SectionWrapper>
    );
};

export default ProjectSection;
