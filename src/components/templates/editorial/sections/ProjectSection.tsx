import React from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  return (
    <SectionWrapper sectionId="projects" className="w-full" style={{ marginTop: `${globalSettings?.sectionSpacing || 32}px` }}>
      <SectionTitle type="projects" globalSettings={globalSettings} showTitle={showTitle} />
      <AnimatePresence mode="popLayout">
        {visibleProjects.map((project) => {
          const projectLink = getProjectLinkMeta(project);

          return (
          <motion.div key={project.id} layout="position" className="relative pb-6 last:pb-0" style={{ marginTop: `${globalSettings?.paragraphSpacing}px` }}>
            
            <motion.h4 layout="position" className="font-bold text-black" style={{ fontSize: `${globalSettings?.subheaderSize || 18}px`, lineHeight: "1.2" }}>
              {project.name}
            </motion.h4>
            
            <motion.div layout="position" className="uppercase tracking-[0.1em] text-gray-500 mt-2" style={{ fontSize: `${globalSettings?.subheaderSize || 16}px` }}>
              {project.role && <span className="font-semibold text-black">{project.role}</span>}
              {project.role && " • "}
              {formatDateString(project.date, locale)}
              {projectLink && (
                <>
                  <span className="mx-2">•</span>
                  <a href={projectLink.href} target="_blank" rel="noopener noreferrer" className="hover:text-black transition-colors" title={projectLink.title}>
                     {projectLink.label}
                  </a>
                </>
              )}
            </motion.div>
            
            {project.description && (
              <motion.div
                layout="position"
                className="mt-2 text-gray-800 prose prose-sm max-w-none prose-p:my-1 [&>ul]:pl-4 [&>ul]:mt-0 [&>ul>li]:my-0.5 marker:text-black text-left"
                style={{ fontSize: `${globalSettings?.baseFontSize || 13}px`, lineHeight: globalSettings?.lineHeight || 1.6 }}
                dangerouslySetInnerHTML={{ __html: normalizeRichTextContent(project.description) }}
              />
            )}
          </motion.div>
        )})}
      </AnimatePresence>
    </SectionWrapper>
  );
};

export default ProjectSection;
