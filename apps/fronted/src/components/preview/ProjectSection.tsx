"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import SectionTitle from "./SectionTitle";
import { Project, GlobalSettings } from "@/types/resume";
import { useResumeStore } from "@/store/useResumeStore";

interface ProjectItemProps {
  project: Project;
  globalSettings?: GlobalSettings;
}

const ProjectItem = React.forwardRef<HTMLDivElement, ProjectItemProps>(
  ({ project, globalSettings }, ref) => {
    const centerSubtitle = globalSettings?.centerSubtitle;

    // 根据centerSubtitle判断网格布局为几列
    const gridColumns = centerSubtitle ? 3 : 2;

    return (
      <motion.div
        layout
        style={{
          marginTop: `${globalSettings?.paragraphSpacing}px`,
        }}
      >
        <motion.div
          layout="position"
          className={`grid grid-cols-${gridColumns} gap-2 items-center justify-items-start [&>*:last-child]:justify-self-end`}
        >
          <div className="flex items-center gap-2">
            <h3
              className="font-bold"
              style={{
                fontSize: `${globalSettings?.subheaderSize || 16}px`,
              }}
            >
              {project.name}
            </h3>
            {project.link && !centerSubtitle && (
              <a
                href={
                  project.link.startsWith("http")
                    ? project.link
                    : `https://${project.link}`
                }
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline"
              >
                {project.link}
              </a>
            )}
          </div>
          {project.role && globalSettings?.centerSubtitle && (
            <motion.div layout="position" className=" text-subtitleFont">
              {project.role}
            </motion.div>
          )}
          {project.date && (
            <div className="text-subtitleFont">{project.date}</div>
          )}
        </motion.div>
        {project.role && !centerSubtitle && (
          <motion.div layout="position" className=" text-subtitleFont">
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
            className="text-blue-500 hover:underline"
          >
            {project.link}
          </a>
        )}
        {project.description && (
          <motion.div
            layout="position"
            style={{
              fontSize: `${globalSettings?.baseFontSize || 14}px`,
              lineHeight: globalSettings?.lineHeight || 1.6,
            }}
            dangerouslySetInnerHTML={{ __html: project.description }}
          ></motion.div>
        )}
      </motion.div>
    );
  }
);

ProjectItem.displayName = "ProjectItem";

interface ProjectSectionProps {
  projects: Project[];
  globalSettings?: GlobalSettings;
}

const ProjectSection: React.FC<ProjectSectionProps> = ({
  projects,
  globalSettings,
}) => {
  const { setActiveSection } = useResumeStore();

  const visibleProjects = projects.filter((project) => project.visible);

  return (
    <motion.div
      className=" hover:cursor-pointer hover:bg-gray-100 rounded-md transition-all duration-300 ease-in-out hover:shadow-md"
      layout
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
      ></SectionTitle>
      <div>
        <AnimatePresence mode="popLayout">
          {visibleProjects.map((project) => (
            <ProjectItem
              key={project.id}
              project={project}
              globalSettings={globalSettings}
            />
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default ProjectSection;
