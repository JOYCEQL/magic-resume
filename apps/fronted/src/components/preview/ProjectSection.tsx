"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import SectionTitle from "./SectionTitle";
import { Project, GlobalSettings } from "@/types/resume";

interface ProjectSectionProps {
  projects: Project[];
  globalSettings?: GlobalSettings;
}

const ProjectSection: React.FC<ProjectSectionProps> = ({
  projects,
  globalSettings,
}) => {
  if (!projects?.length) return null;

  const visibleProjects = projects.filter((project) => project.visible);

  return (
    <motion.div
      layout
      style={{
        marginTop: `${globalSettings?.sectionSpacing || 24}px`,
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

interface ProjectItemProps {
  project: Project;
  globalSettings?: GlobalSettings;
}

const ProjectItem: React.FC<ProjectItemProps> = React.forwardRef(
  ({ project, globalSettings }, ref) => {
    return (
      <motion.div
        layout
        style={{
          marginTop: `${globalSettings?.paragraphSpacing}px`,
        }}
      >
        <motion.div
          layout="position"
          className="flex items-center justify-between"
        >
          <h3 className="font-medium">{project.name}</h3>
          {project.date && <div>{project.date}</div>}
        </motion.div>
        {project.role && (
          <motion.div layout="position" className="font-medium text-baseFont">
            {project.role}
          </motion.div>
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

export default ProjectSection;
