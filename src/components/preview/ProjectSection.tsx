"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import SectionTitle from "./SectionTitle";
import { Project, GlobalSettings } from "@/types/resume";
import { useResumeStore } from "@/store/useResumeStore";
import { normalizeRichTextContent } from "@/lib/richText";
import { getRegionStyle } from "@/config/textStyles";

interface ProjectItemProps {
  project: Project;
  globalSettings?: GlobalSettings;
}

const ProjectItem = React.forwardRef<HTMLDivElement, ProjectItemProps>(
  ({ project, globalSettings }, ref) => {
    const centerSubtitle = globalSettings?.centerSubtitle;
    const subtitleGap = globalSettings?.subtitleGap;
    const useOffsetLayout = centerSubtitle && subtitleGap;

    const itemTitleStyle = getRegionStyle('itemTitle', globalSettings?.regionStyles);
    const itemSubtitleStyle = getRegionStyle('itemSubtitle', globalSettings?.regionStyles);
    const bodyStyle = getRegionStyle('body', globalSettings?.regionStyles);

    const fontWeightMap: Record<string, number> = {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    };

    return (
      <motion.div
        style={{
          marginTop: `${itemTitleStyle.marginTop || 8}px`,
        }}
      >
        {useOffsetLayout ? (
          <motion.div className="flex items-center justify-between">
            <div className="flex items-center">
              <h3
                style={{
                  fontSize: `${itemTitleStyle.fontSize}px`,
                  fontWeight: itemTitleStyle.fontWeight ? fontWeightMap[itemTitleStyle.fontWeight] : 600,
                  lineHeight: itemTitleStyle.lineHeight,
                }}
              >
                {project.name}
              </h3>
              <motion.div 
                layout="position" 
                className="text-subtitleFont"
                style={{ marginLeft: '16px', fontSize: `${itemSubtitleStyle.fontSize}px`, lineHeight: itemSubtitleStyle.lineHeight }}
              >
                {project.role}
              </motion.div>
            </div>
            <div className="text-subtitleFont" style={{ fontSize: `${itemSubtitleStyle.fontSize}px` }}>{project.date}</div>
          </motion.div>
        ) : (
          <motion.div
            className={`grid grid-cols-3 gap-2 items-center justify-items-start [&>*:last-child]:justify-self-end`}
          >
            <div className="flex items-center gap-2">
              <h3
                style={{
                  fontSize: `${itemTitleStyle.fontSize}px`,
                  fontWeight: itemTitleStyle.fontWeight ? fontWeightMap[itemTitleStyle.fontWeight] : 600,
                  lineHeight: itemTitleStyle.lineHeight,
                }}
              >
                {project.name}
              </h3>
            </div>

            {project.link && !centerSubtitle && (
              <a
                href={
                  project.link.startsWith("http")
                    ? project.link
                    : `https://${project.link}`
                }
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
                title={project.link}
              >
                {(() => {
                  try {
                    const url = new URL(
                      project.link.startsWith("http")
                        ? project.link
                        : `https://${project.link}`
                    );
                    return url.hostname.replace(/^www\./, "");
                  } catch (e) {
                    return project.link;
                  }
                })()}
              </a>
            )}

            {!project.link && !centerSubtitle && <div></div>}

            {centerSubtitle && (
              <motion.div layout="position" className=" text-subtitleFont" style={{ fontSize: `${itemSubtitleStyle.fontSize}px` }}>
                {project.role}
              </motion.div>
            )}
            <div className="text-subtitleFont" style={{ fontSize: `${itemSubtitleStyle.fontSize}px` }}>{project.date}</div>
          </motion.div>
        )}
        {project.role && !centerSubtitle && (
          <motion.div layout="position" className=" text-subtitleFont" style={{ fontSize: `${itemSubtitleStyle.fontSize}px` }}>
            {project.role}
          </motion.div>
        )}
        {project.link && centerSubtitle && (
          <a
            href={
              project.link.startsWith("http")
                ? project.link
                : `https://${project.link}`
            }
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
            title={project.link}
          >
            {project.link}
          </a>
        )}
        {project.description ? (
          <motion.div
            layout="position"
            className="mt-2 text-baseFont"
            style={{
              fontSize: `${bodyStyle.fontSize}px`,
              lineHeight: bodyStyle.lineHeight,
              marginTop: bodyStyle.marginTop ? `${bodyStyle.marginTop}px` : undefined,
            }}
            dangerouslySetInnerHTML={{
              __html: normalizeRichTextContent(project.description),
            }}
          ></motion.div>
        ) : (
          <div></div>
        )}
      </motion.div>
    );
  }
);

ProjectItem.displayName = "ProjectItem";

interface ProjectSectionProps {
  projects: Project[];
  globalSettings?: GlobalSettings;
  showTitle?: boolean;
}

const ProjectSection: React.FC<ProjectSectionProps> = ({
  projects,
  globalSettings,
  showTitle = true,
}) => {
  const { setActiveSection } = useResumeStore();

  const visibleProjects = projects?.filter((project) => project.visible);

  return (
    <motion.div
      className="hover:cursor-pointer hover:bg-gray-100 rounded-md transition-all duration-300 ease-in-out hover:shadow-md"
      style={{
        marginTop: `${globalSettings?.sectionSpacing || 24}px`,
      }}
      onClick={() => {
        setActiveSection("projects");
      }}
    >
      <SectionTitle
        type="projects"
        globalSettings={globalSettings}
        showTitle={showTitle}
      />
      <motion.div layout="position">
        <AnimatePresence mode="popLayout">
          {visibleProjects.map((project) => (
            <ProjectItem
              key={project.id}
              project={project}
              globalSettings={globalSettings}
            />
          ))}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
};

export default ProjectSection;
